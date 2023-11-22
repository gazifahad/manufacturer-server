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


var uri ='mongodb+srv://gazifahad34:1yWmPaSySuNIOVUa@cluster0.6sl9quz.mongodb.net/?retryWrites=true&w=majority'
// user:fahad3
// pass : 1yWmPaSySuNIOVUa

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
    // http://localhost:5000/users
    app.get("/users", async (req, res) => {
        const query = {};
        const result = await userCollection.find(query).toArray();
        res.send(result);
    });

    // create one user
    // http://localhost:5000/user/email
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
    // http://localhost:5000/admin/email
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
    // http://localhost:5000/admin/email
    app.get("/admin/:email", async (req, res) => {      
      const email = req.params.email;      
      const user = await userCollection.findOne({email : email}); 
      const isAdmin = user.role === 'admin';  
      res.send({ isAdmin: isAdmin});
    });

    

    // find one item by id
    // http://localhost:5000/item/6274a3425a04790168facc8c
    app.get("/item/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await productCollection.findOne(filter);
      res.send(result);
    });
    // find one item by email
    // http://localhost:5000/addedby/abdullah71faisal@gamil.com
    app.get("/addedby/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { addedby:email};
      const result = await productCollection.find(filter).toArray();
      res.send(result);
    });

    
    

    //update item
    // http://localhost:5000/item/6274a3425a04790168facc8c
    app.put("/item/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const updateItem = {        
        $set: req.body,
      };
      const result = await productCollection.updateOne(filter, updateItem);
      res.send({success: true, result})
    });

    // delete item
    // http://localhost:5000/item/6274a3425a04790168facc8c
    app.delete("/item/:id", async (req, res) => {
        const id = req.params.id;
        const filter = { _id: ObjectId(id) };
        const result = await productCollection.deleteOne(filter);  
        res.send({message: "the item deleted"})
      });


// ******************************
//     products 
// ******************************

// get all products
    // http://localhost:5000/products
    app.get("/products", async (req, res) => {
      const query = {};
      const result = await productCollection.find(query).toArray();
      res.send(result);
    });
    // get one product
    // http://localhost:5000/product/628f2ffc78debc74680fc1fd
    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await productCollection.findOne(filter);
      res.send(result);
    });

    // create one product
    // http://localhost:5000/product
    app.post("/product", async (req, res) => {
      const item = req.body;
      const result = await productCollection.insertOne(item);
      res.send({ success: true, result});
    });

     //delete one product
      // http://localhost:5000/product/id
     app.delete("/product/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await productCollection.deleteOne(filter);  
      res.send({message: "requested item deleted"})
    });



    
// ******************************
//     orders 
// ******************************

// get all orders
    // http://localhost:5000/orders
    app.get("/orders", async (req, res) => {
      const query = {};
      const result = await orderCollection.find(query).toArray();
      res.send(result);
    });
    // get my orders
    // http://localhost:5000/orders/abdus@salam.com
    app.get("/orders/:email", async (req, res) => {
      const email = req.params.email;
      const query = {orderedBy: email};
      const result = await orderCollection.find(query).toArray();
      res.send(result);
    });

    
    // get not shiped orders
    // http://localhost:5000/order
    app.post("/notshipedorders", async (req, res) => {
      const query = {};
      const notShiped = {isShiped : false};
      const result = await orderCollection.find(notShiped).toArray();
      res.send({ message: "all unshipped orders loaded", result});
    });

    // create one order
    // http://localhost:5000/order
    app.post("/order", async (req, res) => {
      const item = req.body;
      const result = await orderCollection.insertOne(item);
      res.send({ success: true, result});
    });

    // pay one order
    // http://localhost:5000/order/id
    app.get("/order/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await orderCollection.findOne(filter);
      res.send(result);
    });

 // payment confirm order
    // http://localhost:5000/admin/email
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

 // http://localhost:5000/reviews
 app.get("/reviews", async (req, res) => {
  const query = {};
  const result = await reviewCollection.find(query).toArray();
  res.send(result);
});

// create one review
// http://localhost:5000/review
app.post("/review", async (req, res) => {
  const review = req.body;
  const result = await reviewCollection.insertOne(review);
  res.send({ message: "your review added", result});
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
  res.send("welcome to household Tools Corp");
});

app.listen(port, () => {
  console.log("household Tools Corp is running on Port", port);
});
