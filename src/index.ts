import Express from "express";

import router from "./router";

const app = Express();

app.use(Express.json());
app.use(Express.urlencoded({extended: true}));
app.use(router);

app.listen(process.env.PORT, ()=> {
    console.log("<!> Server running on port " + process.env.PORT);
})
