const {Suggestions} = require('actions-on-google');
const {Suggestion, Card} = require("dialogflow-fulfillment");
const {WebhookClient,Image}=require("dialogflow-fulfillment");
const { request, response } = require("express");
const express=require("express");
const app=express();
const axios = require('axios');


//database connection



// dialogflow app pr post ki request bhejegaa

app.get("/",(req,res)=>{
    res.send("hi")
})

let TotalOrders =[]
let TotalPrice=[0]
let TimechoosenForOrder=[""]
let customerDetails=[]


app.post("/webhook",express.json(),(request,response)=>{          //fulfillment mai bhi url mai /webhook lagana huga 
    const agent=new WebhookClient({request:request,response:response});
 
    function getCustomerData(){
        return axios.get('https://sheetdb.io/api/v1/1agcu2av1vkix');

      }
     
      function fallback(agent) {
        agent.add(`I didn't understand`);
        agent.add(`I'm sorry, can you try again?`);
      }
    
      function signupretrival(agent){
       const {
          name, email, password, phone
        } = agent.parameters;
        
        const data = [{
          Name: name,
          Email: email,
          Phone: phone,
          Password: password
        }];
        axios.post('https://sheet.best/api/sheets/11c5041e-81c4-469e-b704-64f7b394f8de', data);
        customerDetails.push(name)
        customerDetails.push(phone)
        agent.add(`Your account has been created!`);
        agent.add(`Click /here to order with us!`);

      }

      
      async function signinretrival(agent){
        const email = agent.parameters.email;
        const password = agent.parameters.password;

       return getCustomerData().then(res => {
          res.data.map(person => {
          if(person.Password == password && person.Email == email){
                  console.log(person)
                  customerDetails.push(person.Name)
                  customerDetails.push(person.Phone)
                  agent.add(`Welcome back ${person.Name}, click /here to order with us!`);
                    }
            });
        });
      }
    
       function getCustomerCreditData(){
        return axios.get('https://sheet.best/api/sheets/e7c179e9-eef0-4dd6-aa7d-e14754cb8127');
      }
       
      function foodDetail(){
      return axios.get('https://sheet.best/api/sheets/08be6b4b-bfd3-408e-8ead-9293b6878363');
      }
      
      function foodDetailByID(ID){
        let data=axios.get(`https://sheet.best/api/sheets/a33f94ab-a441-45dd-8564-8de305e0ef78`);
        // let price=data.status
        return axios.get(`https://sheet.best/api/sheets/a33f94ab-a441-45dd-8564-8de305e0ef78`)
        }
        

      function input_newcard(agent){
         const {
          ccnum, ccdate, cvc, password
        } = agent.parameters;
    
        return getCustomerData().then(res => {
          res.data.map(person => {
          if(person.Password == password){
                  const data = [{
                    Password: password, 
                    Credit_card_number: ccnum,
                    CVC: cvc,
                    Expiry_date: ccdate              
                    }];
            axios.post('https://sheet.best/api/sheets/e7c179e9-eef0-4dd6-aa7d-e14754cb8127', data);
            // getReceipt()
            agent.add(`Card has been added and payment is completed. Click /here to return to the main menu.`);
            agent.add('Click /Receipt to see reciept')
                  }
              });
         });
      }
      
        function input_existingcard(agent){
        const password = agent.parameters.password;
        let pcounter=0;
       return getCustomerCreditData().then(res => {
          res.data.map(person => {
          if(person.Password == password){
                  agent.add(`Payment is successful. Click /here to return to the main menu.`);
                  agent.add('Click /Receipt to see reciept')
                  // getReceipt()
                  pcounter=1
                }
            });
          if(pcounter==0){
            agent.add("Password was incorrect Please try again ")
            agent.add(new Suggestion("Exisiting Card"))
            agent.add(new Suggestion("New Card"))
          }
        });
      }

      async function addorder(agent){
        let itemID=agent.parameters.itemID
        let ID=itemID.toUpperCase();      
        let quantity=agent.parameters.quantiy  
        // console.log(await foodDetail())

        try{
          let res=await foodDetailByID(ID)  //getting item
          let ItemName=res.data[0].FoodName
          let StallName=res.data[0].StallName
          let ItemPrice=res.data[0].FoodPrice;  //fetching price 
          let order={     // making order to add in total order of a person
            ItemId: ID,
            Quantity: quantity,
            ItemName:ItemName,
            StallName:StallName,
            TotalPrice: ItemPrice*quantity
          }
  
  
          TotalOrders.push(order)
  
          console.log("Order is this ",TotalOrders)
          agent.add("Order is successfully added to cart!!")
          agent.add("To continue ordering, select order to enter your next item or proceed to choose a pick up time.")
          agent.add(new Suggestion('Pick Up scheduling'))
          agent.add(new Suggestion('Order'))
        }
        catch{
          TotalOrders =[]
          TotalPrice=[0]
          agent.add("Please give a valid ID for the items")
          agent.add(new Suggestion('Order'))
        }

      }


      function getReceipt(){
        let word=''
        let totalPrice=TotalPrice.pop()
        for(i in TotalOrders){
          console.log(TotalOrders[i])
          let new_item=`\n Item ID : ${TotalOrders[i].ItemId} \n Item Name: ${TotalOrders[i].ItemName} \n Stall Name: ${TotalOrders[i].StallName} \n Item Quantity : ${TotalOrders[i].Quantity} \n Price : $${TotalOrders[i].TotalPrice} \n`
          word+=new_item
          totalPrice+=TotalOrders[i].TotalPrice
        }

        word+=`\n Total Price is $${totalPrice}`

        deliveryTime=TimechoosenForOrder.pop()
        TimechoosenForOrder=[""]
        
        word+=`\n Pick Up Time is ${deliveryTime}`

        TotalPrice.push(totalPrice)

        let customerPhone=customerDetails.pop();
        let customerName=customerDetails.pop();

        word+=`\n Customer Name is : ${customerName} `

        word+=`\n Customer Phone number is : ${customerPhone} `

        axios.post('https://telegramapi-bot.herokuapp.com/message',{
          data:word
        });

         TotalOrders =[]
         TotalPrice=[0]

        return word
      }
      

      function showReceipt(agent){
        
        word=getReceipt()
        agent.add(new Card({ 
        title: `Receipt`,
        text: word,
        }))

      }

      function pickup(agent){
        let timeChoosen=agent.parameters.pickuptime
        let timer=timeChoosen.split("T")
        let Actualtime=timer[1].split(":")
        let time_selected=Actualtime[0] + " : " + Actualtime[1]
        TimechoosenForOrder.push(time_selected)
        hours =parseInt(Actualtime[0])
        minutes=parseInt(Actualtime[1])
        console.log(hours)
        if (hours>=9 && hours<=20){
          agent.add("Thank you for entering your preferred pickup timeslot! You may now proceed to payment.")
          agent.add(new Suggestion('Payment'))
        }
        else{
          agent.add("Please select time  between 9 AM to 9 PM")
          agent.add(new Suggestion('Pick Up scheduling'))
          agent.add(new Suggestion("order"))
        }

      }

      function Payment(agent){
        agent.add(new Card({
          title: `Payment`,
          text: `How would you like to proceed with your payment?`,
        }))
        agent.add(new Suggestion('Credit card'))
        agent.add(new Suggestion('PayLah! QR'))
      }
      

      function Paylah(agent){
          // console.log(getReceipt())
      }

      function card(agent){
        agent.add(new Card({
          title: `Credit card usage`,
          text: `Would you like to use an existing card or a new card?`,
        }))
        agent.add(new Suggestion("Existing card"))
        agent.add(new Suggestion("New card"))

      }

      
      let intentMap = new Map();
      intentMap.set('Default Fallback Intent', fallback);
      intentMap.set('SignUp', signupretrival);
      intentMap.set('SignIn', signinretrival);
  // 
      intentMap.set('PayLah! QR - Receipt', showReceipt);
      intentMap.set('New card - Receipt', showReceipt);
      intentMap.set('Existing card - Receipt', showReceipt);

      intentMap.set('Existing or new card',card)
      intentMap.set('New card', input_newcard);
      
      intentMap.set('Adding to order', addorder);
      
      intentMap.set('Pick Up Scheduling',pickup);

      // 
      intentMap.set('Payment',Payment)
      intentMap.set('PayLah! QR',Paylah)
      intentMap.set('Existing card', input_existingcard);
      agent.handleRequest(intentMap);
})


const port = process.env.PORT || 4000;

app.listen(port,()=>{
    console.log("server is up on 4000");
})
