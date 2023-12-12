var express = require("express");
var router = express.Router();
const userModel = require("./users");
const postsModel = require("./posts");
const upload = require('./multer');

const localStrategy = require('passport-local');
const passport = require("passport");
passport.use(new localStrategy(userModel.authenticate()));

/* GET home page. */
router.get("/", function (req, res) {
  res.render("index");
});

router.get("/login", function(req, res){
  // console.log(req.flash('error'));
  res.render('login', {error: req.flash('error')});
})

router.get("/profile", isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({
    username: req.session.passport.user
  }).populate("posts")

  // console.log(user);
  res.render("profile", {user});
});

router.get("/feed", isLoggedIn, async (req, res) => {
  const user = await userModel.findOne({
    username: req.session.passport.user
  })

  const allPost = await postsModel.find();
  // console.log(allPost);

  res.render("feed", {
    posts: allPost,
    user
  });
})

router.get("/createpost", isLoggedIn, async (req, res) => {
  const user = await userModel.findOne({
    username: req.session.passport.user
  })

  res.render("create-post", {user});
})

router.post("/register", (req, res) => {
  const userData = new userModel({
    username: req.body.username,
    email: req.body.email,
    fullname: req.body.fullname,
  })

  userModel.register(userData, req.body.password)
  .then(function(){
    passport.authenticate("local")(req,res, function(){
      res.redirect("/profile");
    })
  })
})

router.post("/login", passport.authenticate("local", {
  successRedirect: "/profile",
  failureRedirect: "/login",
  failureFlash: true,
}),function(req, res){
});

router.get('/logout', function(req, res, next){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});

router.post('/upload', isLoggedIn ,upload.single('file'), async (req, res) => {
  if(!req.file){
    return res.status(400).send("No file uploaded.");
  }

  const user = await userModel.findOne({username: req.session.passport.user});

  const post = await postsModel.create({
    imgText: req.body.caption,
    image: req.file.filename,
    user: user._id,
  });

  user.posts.push(post._id);
  await user.save();

  res.redirect("/profile");

});

router.post('/picupload', isLoggedIn ,upload.single('pic'), async (req, res) => {
  if(!req.file){
    return res.status(400).send("No file uploaded.");
  }

  const user = await userModel.findOne({username: req.session.passport.user});
  user.dp = req.file.filename;
  await user.save();

  res.redirect("/profile");

});

function isLoggedIn(req, res, next){
  if(req.isAuthenticated())return next();
  res.redirect("/login");
}

module.exports = router;
