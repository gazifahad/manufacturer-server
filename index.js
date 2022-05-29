const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const app = express();
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const stripe = require("stripe")('sk_test_51L2IafEwxTNKPPwRmynUXRjPJCDUP4fUluUqwjuIHemwhjO4jrir2ZGU7nDrtd7CItZ6qnEHIE9eH7n3a8QqLqvK00QCUgsluA');

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// var uri = `mongodb://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0-shard-00-00.ahkxb.mongodb.net:27017,cluster0-shard-00-01.ahkxb.mongodb.net:27017,cluster0-shard-00-02.ahkxb.mongodb.net:27017/?ssl=true&replicaSet=atlas-bxflci-shard-0&authSource=admin&retryWrites=true&w=majority`;
var uri ='mongodb+srv://fahad3:bg7dt2hqdxrOdaXp@cluster0.mmh3b.mongodb.net/?retryWrites=true&w=majority'
// user:fahad3
// pass : bg7dt2hqdxrOdaXp

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});


function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'UnAuthorized'});
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, 'nothing', function (error, decoded) {
    if (error) {
      return res.status(403).send({ message: 'Forbidden access' })
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    await client.connect();
    const userCollection = client.db("Solid_Tools_Corp").collection("all_users");
    const productCollection = client.db("Solid_Tools_Corp").collection("all_products");
    const reviewCollection = client.db("Solid_Tools_Corp").collection("all_reviews");
    const orderCollection = client.db("Solid_Tools_Corp").collection("all_orders");


// ******************************
//     users 
// ******************************

    // get all users
    // https://immense-oasis-80254.herokuapp.com/users
    app.get("/users", async (req, res) => {
        const query = {};
        const result = await userCollection.find(query).toArray();
        res.send(result);
    });

    // create one user
    // https://immense-oasis-80254.herokuapp.com/user/email
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const filter = {email : email};
      const options = { upsert : true };
      const updateUser = {
        $set : {email : email},
      }      
      const result = await userCollection.updateOne(filter, updateUser, options);
      const token = jwt.sign({email : email}, 'nothing', { expiresIn: '1h' });
      // res.send({ success: true, result});
      res.send({ success: true, result, token});
    });


    // make an user Admin
    // https://immense-oasis-80254.herokuapp.com/admin/email
    app.put("/admin/:email", async (req, res) => {      
      const email = req.params.email;
      const filter = {email : email};
      const options = { upsert : true };
      const updateUser = {
        $set : {role : 'admin'},
      }      
      const result = await userCollection.updateOne(filter, updateUser, options);      
      res.send({ success: true, result});
    });


    // check Admin
    // https://immense-oasis-80254.herokuapp.com/admin/email
    app.get("/admin/:email", async (req, res) => {      
      const email = req.params.email;      
      const user = await userCollection.findOne({email : email}); 
      const isAdmin = user.role === 'admin';  
      res.send({ isAdmin: isAdmin});
    });

    

    // find one item by id
    // https://immense-oasis-80254.herokuapp.com/item/6274a3425a04790168facc8c
    app.get("/item/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await warehouseCollection.findOne(filter);
      res.send(result);
    });
    // find one item by email
    // https://immense-oasis-80254.herokuapp.com/addedby/abdullah71faisal@gamil.com
    app.get("/addedby/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { addedby:email};
      const result = await warehouseCollection.find(filter).toArray();
      res.send(result);
    });

    
    

    //update item
    // https://immense-oasis-80254.herokuapp.com/item/6274a3425a04790168facc8c
    app.put("/item/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const updateItem = {        
        $set: req.body,
      };
      const result = await warehouseCollection.updateOne(filter, updateItem);
      res.send({success: true, result})
    });

    // delete item
    // https://immense-oasis-80254.herokuapp.com/item/6274a3425a04790168facc8c
    app.delete("/item/:id", async (req, res) => {
        const id = req.params.id;
        const filter = { _id: ObjectId(id) };
        const result = await warehouseCollection.deleteOne(filter);  
        res.send({message: "item deleted"})
      });


// ******************************
//     products 
// ******************************

// get all products
    // https://immense-oasis-80254.herokuapp.com/products
    app.get("/products", async (req, res) => {
      const query = {};
      const result = await productCollection.find(query).toArray();
      res.send(result);
    });
    // get one product
    // https://immense-oasis-80254.herokuapp.com/product/628f2ffc78debc74680fc1fd
    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await productCollection.findOne(filter);
      res.send(result);
    });

    // create one product
    // https://immense-oasis-80254.herokuapp.com/product
    app.post("/product", async (req, res) => {
      const item = req.body;
      const result = await productCollection.insertOne(item);
      res.send({ success: true, result});
    });

     //delete one product
      // https://immense-oasis-80254.herokuapp.com/product/id
     app.delete("/product/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await productCollection.deleteOne(filter);  
      res.send({message: "item deleted"})
    });



    
// ******************************
//     orders 
// ******************************

// get all orders
    // https://immense-oasis-80254.herokuapp.com/orders
    app.get("/orders", async (req, res) => {
      const query = {};
      const result = await orderCollection.find(query).toArray();
      res.send(result);
    });
    // get my orders
    // https://immense-oasis-80254.herokuapp.com/orders/abdus@salam.com
    app.get("/orders/:email", async (req, res) => {
      const email = req.params.email;
      const query = {orderedBy: email};
      const result = await orderCollection.find(query).toArray();
      res.send(result);
    });

    
    // get not shiped orders
    // https://immense-oasis-80254.herokuapp.com/order
    app.post("/notshipedorders", async (req, res) => {
      const query = {};
      const notShiped = {isShiped : false};
      const result = await orderCollection.find(notShiped).toArray();
      res.send({ message: "all not shiped orders loaded", result});
    });

    // create one order
    // https://immense-oasis-80254.herokuapp.com/order
    app.post("/order", async (req, res) => {
      const item = req.body;
      const result = await orderCollection.insertOne(item);
      res.send({ success: true, result});
    });

    // pay one order
    // https://immense-oasis-80254.herokuapp.com/order/id
    app.get("/order/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await orderCollection.findOne(filter);
      res.send(result);
    });

 // payment confirm order
    // https://immense-oasis-80254.herokuapp.com/admin/email
    app.put("/admin/:email", async (req, res) => {      
      const email = req.params.email;
      const filter = {email : email};
      const options = { upsert : true };
      const updateUser = {
        $set : {role : 'admin'},
      }      
      const result = await userCollection.updateOne(filter, updateUser, options);      
      res.send({ success: true, result});
    });







// ******************************
//     reviews 
// ******************************

 // https://immense-oasis-80254.herokuapp.com/reviews
 app.get("/reviews", async (req, res) => {
  const query = {};
  const result = await reviewCollection.find(query).toArray();
  res.send(result);
});

// create one review
// https://immense-oasis-80254.herokuapp.com/review
app.post("/review", async (req, res) => {
  const review = req.body;
  const result = await reviewCollection.insertOne(review);
  res.send({ message: "review added", result});
});


//*********************** */
// Payment
//***************** */

app.post("/create-payment-intent", async (req, res) => {
  const { price } = req.body;
  const amount = price*100;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: "usd",
    payment_method_types: ['cards'],   
  });
  res.send({
    clientSecret: paymentIntent.client_secret,
  });

})




  } finally {
  }
}
run().catch(console.dir);

// backend initialize
app.get("/", (req, res) => {
  res.send("welcome to Solid Tools Corp");
});

app.listen(port, () => {
  console.log("Solid Tools Corp is running on Port", port);
});
