const { response } = require('express');
var express = require('express');
var router = express.Router();
var adminHelper = require('../helpers/admin-helper');
const userHelper = require('../helpers/user-helper');
var UserHelper = require('../helpers/user-helper')
var db = require('../config/connection');
const fs = require('fs'); // Require file system module

//twilio
const accountSid = process.env.accountSid
const authToken = process.env.authToken
const client = require('twilio')(accountSid, authToken);
const verificationToken = process.env.verificationToken
//===============================================User Login Section Start Here===================================================================
//Using of midelware
const verifyLogin = (req, res, next) => {
  if (db.get() === null) {
    res.render('user/something-went-wrong')
  }
  if (req.session.logedIn) {
    next();
  } else {
    res.redirect('/login')
  }
}


router.get('/login', async (req, res) => {
  let allCategory = await adminHelper.getALLCategory()
  //console.log(req.session.user)
  if (req.session.user) {
    res.redirect('/')
  } else {
    res.render('user/login', { user: true, "logedinErr": req.session.logedinErr, blockuser: req.session.blockuser, allCategory })
    req.session.logedinErr = false
    req.session.blockuser = false
  }
})

router.get('/signup', (req, res) => {
  emailExist = req.session.emailExist
  res.render('user/signup', { user: true, emailExist })
  req.session.emailExist = false
})

router.post('/signup', (req, res) => {
  UserHelper.doSignup(req.body).then((response) => {
    //console.log(response.emailExist);
    if (response.emailExist) {
      req.session.emailExist = "Email is already Exist!!!";
      res.redirect('/signup')
    } else {
      req.session.user = response;
      req.session.logedIn = true;
      res.redirect('/')
    }
  })
})

router.post('/login', (req, res) => {
  UserHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      /* Here we create an session for single user with its all details */
      req.session.user = response.user;
      req.session.logedIn = true;
      res.redirect('/')
    } else {
      if (response.blockuser) {
        req.session.blockuser = response.blockuser
        res.redirect('/login')
      } else {
        req.session.logedinErr = true;
        res.redirect('/login')
      }

    }

  })
})

router.get('/mobile-number', (req, res) => {
  if (req.session.logedIn) {
    res.redirect('/')
  }
  else {
    res.render('user/mobile-number', { user: true, "nouser": req.session.noUser, "accoutBlocked": req.session.accountBlocked })
    req.session.noUser = false
    req.session.accountBlocked = false
  }
})

router.post('/mobile-number', (req, res) => {
  let mobileNo = req.body.mobile
  userHelper.getMobileDetails(mobileNo).then((user) => {
    // console.log(user)
    if (user) {
      if (user.blockuser === false) {
        client.verify.services(verificationToken).verifications.create({
          to: `+91${req.body.mobile}`,
          channel: "sms"
        }).then((resp) => {
          req.session.mobileNumber = resp.to
          res.redirect('/otp-verification')
        }).catch((err) => {
          console.log(err)
        })
      }
      else {
        req.session.accountBlocked = true
        res.redirect('/mobile-number')
        console.log("account is blocked")
      }

    } else {
      req.session.noUser = true
      res.redirect('/mobile-number')
      console.log("No user found111111")
    }

  })
})

router.post('/mobile-number1', (req, res) => {
  let mobileNo = req.body.mobile
  userHelper.getMobileDetails(mobileNo).then((user) => {
    if (user) {
      if (user.blockuser === false) {
        client.verify.services(verificationToken).verifications.create({
          to: `+91${req.body.mobile}`,
          channel: "call"
        }).then((resp) => {
          req.session.mobileNumber = resp.to
          res.redirect('/otp-verification')
        }).catch((err) => {
          console.log(err)
        })
      }
      else {
        req.session.accountBlocked = true
        res.redirect('/mobile-number')
        console.log("account is blocked")
      }

    } else {
      req.session.noUser = true
      res.redirect('/mobile-number')
      console.log("No user found111111")
    }

  })
})


router.get('/otp-verification', async (req, res) => {
  if (req.session.logedIn) {
    res.redirect('/')
  } else {
    mobileNumber = req.session.mobileNumber
    res.render('user/otp-verification', { user: true, mobileNumber, "invalidOtp": req.session.invalidOtp })
    req.session.invalidOtp = false

  }
})
router.post('/otp-verification', (req, res) => {
  let otp = req.body.otp
  console.log(otp)
  let number = req.session.mobileNumber
  client.verify
    .services(verificationToken)
    .verificationChecks.create({
      to: number,
      code: otp
    }).then((response) => {
      if (response.valid) {
        number = number.slice(3);
        userHelper.getMobileDetails(number).then(async (user) => {
          req.session.user = user
          req.session.logedIn = true;
          res.redirect('/')
        })
      } else {
        console.log("otp entered is not valid");
        req.session.invalidOtp = true
        res.redirect('/otp-verification')
      }
    }).catch((err) => {
      req.session.invalidOtp = true
      console.log("otp errorrrrr")
      //console.log(err)
      res.redirect('/otp-verification')
    })
})
router.get("/change-password", verifyLogin, async (req, res) => {
  let cartCount = null
  let allCategory = await adminHelper.getALLCategory()
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id)
  }
  user_login = req.session.user
  message = req.session.message
  res.render("user/change-password", { user: true, user_login, cartCount, message, allCategory })
  req.session.message = false;
})

router.post("/change-password/:id", verifyLogin, (req, res) => {
  userHelper.changePassword(req.params.id, req.body).then((response) => {
    console.log(response);
    if (response.status) {
      res.redirect("/edit-profile");
    } else {
      req.session.message = "You have entered a wrong password";
      res.redirect("/change-password");
    }
  })
})
router.get('/logout', (req, res) => {
  req.session.user = null;
  req.session.logedIn = false;
  res.redirect('/');
})
//=====================================================User Login Section End Here==============================================================
//=====================================================Home Page Start Section==================================================================
router.get('/', async (req, res) => {
  if (db.get() === null) {
    res.render('user/something-went-wrong')
  } else {
    let user_login = req.session.user;
    let cartCount = null
    if (req.session.user) {
      cartCount = await userHelper.getCartCount(req.session.user._id)
    }
    let allCategory = await adminHelper.getALLCategory()
    let banners = await adminHelper.getALLBanners();

    adminHelper.getRandomProducts().then((product) => {
      res.render('user/home', { user: true, user_login, cartCount, product, allCategory, banners })
    })
  }

  // res.render('user/home',{user:true,user_login,cartCount})
})

//=====================================================Home Page End Section==================================================================

router.get('/products-details-category/:categoryName', async (req, res) => {
  if (db.get() === null) {
    res.render('user/something-went-wrong')
  }
  let user_login = req.session.user
  let categoryName = req.params.categoryName
  let allCategory = await adminHelper.getALLCategory()
  let cartCount = null
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id)
  }
  productBasedOnCategory = await userHelper.productBasedOnCategory(categoryName)
  res.render('user/category', { user: true, user_login, categoryName, productBasedOnCategory, allCategory, cartCount })
})

router.get('/view-single-product/:id', async (req, res) => {
  let user_login = req.session.user;
  let allCategory = await adminHelper.getALLCategory()
  let cartCount = null
 
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id)
  }

  adminHelper.getProductDetails(req.params.id).then((product) => {
    adminHelper.getRelatedProducts(product.category).then((relatedProducts) => {
      // Check if images exist
      let firstImageExists = fs.existsSync(`./public/images/${req.params.id}first.jpg`);
      let secondImageExists = fs.existsSync(`./public/images/${req.params.id}second.jpg`);
      let thirdImageExists = fs.existsSync(`./public/images/${req.params.id}third.jpg`);
      let fourthImageExists = fs.existsSync(`./public/images/${req.params.id}fourth.jpg`);
      // Add image existence status to product object
      product.firstImageExists = firstImageExists;
      product.secondImageExists = secondImageExists;
      product.thirdImageExists = thirdImageExists;
      product.fourthImageExists = fourthImageExists;
      res.render('user/single-product-details', { relatedProducts, product, user: true, user_login, cartCount, allCategory });
      req.session.errorMessage = false;
    })
  })

})


//================================================================Cart Section Start Here======================================================
router.get('/cart', verifyLogin, async (req, res) => {
  let user_login = req.session.user;
  let allCategory = await adminHelper.getALLCategory()
  let cartCount = null
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id)
  }

  let product_list = await userHelper.getCartProducts(req.session.user._id)
  let totalAmount = 0
  if (product_list.length > 0) {
    totalAmount = await userHelper.getTotalAmount(req.session.user._id)
  }
  if (totalAmount <= 0) {
    res.redirect('/empty-cart')

  }
  res.render('user/cart', { user: true, product_list, user_login, totalAmount, cartCount, allCategory })
})


router.get('/add-to-cart/:id', (req, res) => {
  if (req.session.logedIn) {
    userHelper.addToCart(req.params.id, req.session.user._id).then(() => {
      res.json({ status: true })
    });
  }

  else {
    res.json({ status: false })
    console.log("please login")

  }
})

router.post('/change-product-quantity', (req, res, next) => {
  userHelper.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelper.getTotalAmount(req.session.user._id)
    res.json(response)
  })
})

router.get("/remove-product-from-cart/:id/:prodId", (req, res, next) => {
  userHelper.deleteProductFromCart(req.params.id, req.params.prodId).then(() => {
    res.redirect('/cart')
  });
});

router.get('/empty-cart', verifyLogin, async (req, res) => {
  let cartCount = 0;
  let allCategory = await adminHelper.getALLCategory()
  let user_login = req.session.user;
  res.render('user/empty-cart', { user: true, user_login, cartCount, allCategory })
})

//================================================================Cart Section End Here======================================================


router.get('/place-order', async (req, res) => {
  let products = await userHelper.getCartProductList(req.session.user._id);
  let totalPrice = await userHelper.getTotalAmount(req.session.user._id);
  await userHelper.placeOrder(req.session.user, products, totalPrice)
  res.redirect('/order-placed-sucessfully')
})

router.get('/order-placed-sucessfully', verifyLogin, async (req, res) => {
  let user_login = req.session.user;
  let allCategory = await adminHelper.getALLCategory()
  let cartCount = 0;
  res.render('user/order-placed-sucessfully', { user: true, user_login, cartCount, allCategory })
})


router.get("/edit-profile", verifyLogin, async (req, res) => {
  user_login = req.session.user
  let allCategory = await adminHelper.getALLCategory()
  let cartCount = null
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id)
  }
  userHelper.getProfileDetails(user_login._id).then((profileDetails) => {
    // console.log(profileDetails)
    res.render("user/edit-profile", { user: true, user_login, profileDetails, cartCount, allCategory })
  })
});

router.post('/edit-profile/:id', (req, res) => {
  userHelper.updateProfileDetails(req.params.id, req.body).then((response) => {
    if (req.files) {
      if (req.files.image) {
        let image = req.files.image
        image.mv('./public/profile/' + req.params.id + '.jpg');
      }
    }
    res.redirect('/')
  })
})



router.post("/getSearchProduct", async (req, res) => {
  let payload = req.body.payload.trim();
  userHelper.productSearch(payload).then((search) => {
    res.send({ payload: search });
  });
});

//==============================================
router.get('/about', async (req, res) => {
  let aboutUs = await adminHelper.getALLAboutUsDetails();
  let branch = await adminHelper.getALLBranchDetails();
  let allCategory = await adminHelper.getALLCategory()
  res.render('user/about', { user: true, aboutUs, branch ,allCategory})
})
module.exports = router;
