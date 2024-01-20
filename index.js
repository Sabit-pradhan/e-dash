const express = require("express");
const cors = require("cors");
require('./db/config');
const User = require('./db/User');
const Product = require("./db/Product");
const Jwt = require('jsonwebtoken');
const JwtKey='e-comm';
const app = express();

app.use(express.json());
app.use(cors());

app.post("/register", async (req, resp) => {
    let newUser = new User(req.body);
    let result = await newUser.save();
    result = result.toObject();
    delete result.password;

    Jwt.sign({ result }, JwtKey, { expiresIn: "2h" }, (err, token) => {
        if (err) {
            resp.send({ result: "something went wrong, please try after some time" });
        } else {
            // Send the user data along with the token
            resp.send({ result, auth: token });
        }
    });
});

app.post("/login", async (req, resp) => {
    console.log(req.body);
    if (req.body.password && req.body.email) {
        let user = await User.findOne(req.body).select("-password");
        if (user) {
            Jwt.sign({ user }, JwtKey, { expiresIn: "2h" }, (err, token) => {
                if (err) {
                    resp.send({ result: "something went wrong, please try after some time" });
                } else {
                    // Send the user data along with the token
                    resp.send({ user, auth: token });
                }
            });
        } else {
            resp.send({ result: 'No User Found' });
        }
    } else {
        resp.send({ result: 'Invalid Request' });
    }
});

app.post("/add-product", verifyToken, async(req, resp)=>{
let product =new Product(req.body);
let result = await product.save();
resp.send(result)
});

app.get("/products", verifyToken,async(req,resp)=>{
    let products = await Product.find();
    if(products.length>0){
        resp.send(products)
    }else{
        resp.send({result:"No Products Found"})
    }
});
app.delete("/product/:id", verifyToken,  async (req, res) => {
    
        let result = await Product.deleteOne({ _id: req.params.id });
        res.send(result);
}),
app.get("/product/:id", verifyToken, async (req, res) => {
    
        let result = await Product.findOne({ _id: req.params.id });
        if (result) {
            res.send(result);
        } else {
            res.send({ result: "No Record Found" });
    }
})
app.put("/product/:id" , verifyToken, async (req, resp)=>{
    let result = await Product.updateOne(
        {_id: req.params.id},
        {
            $set : req.body
        }
)
resp.send(result)

});
app.get("/search/:key", verifyToken, async(req, resp)=>{
    let result = await Product.find({
        "$or":[
            { name:{$regex:req.params.key}},
            { company: { $regex: req.params.key}},
            { category: { $regex: req.params.key}}
                
            
        ]
    });
    resp.send(result)
});

function verifyToken(req, resp, next) {
    let token = req.headers['authorization'];
    if (token) {
        token = token.split(' ')[1];  // Corrected splitting logic
        Jwt.verify(token, JwtKey, (err, valid) => {
            if (err) {
                resp.status(401).send({ result: "Please provide a valid token with the header" });
            } else {
                next();
            }
        });
    } else {
        resp.status(402).send({ result: "Please add a token with the header" });
    }
}




app.listen(5000); 