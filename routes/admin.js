var express = require('express');
var router = express.Router();
const adminHelper= require('../helpers/admin-helper')
const userHelper = require('../helpers/user-helper');
const fs=require('fs');
var db=require('../config/connection');


//twilio
const accountSid =process.env.accountSid
const authToken = process.env.authToken
const messagingSid=process.env.messagingSid
const client = require('twilio')(accountSid,authToken); 

const verifyLogin = (req, res, next) => {
  if(db.get()===null){
    res.render('user/something-went-wrong')
  }
  if (req.session.adminloggedIn) {
    next();
  } else {
    res.redirect("/admin");
  }
}


/**Admin login section  */
router.get("/", async(req, res) => {
  let admin = req.session.adminloggedIn;
  if (admin) {
      // let paymentMethod=await adminHelper.paymentMethods();
      // let orderStatus=await adminHelper.OrderStatus();
      // let FoodItemCount=await adminHelper.getFoodItemCount();
      // let UserCount=await adminHelper.getUserCount();
      // let profit=await adminHelper.getProfit();
      // let delivredCount=await adminHelper.getDeliveredCount()
      res.render('admin/dashboard',{admin:true})
  } else {
    res.render("admin/adminlogin", { loginErr: req.session.loginErr });
    req.session.loginErr = false;
  }
});

router.post("/", (req, res) => {
  adminHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.adminloggedIn = true;
      req.session.admin = response.admin;
      res.redirect("/admin");
    } else {
      req.session.loginErr = "Invalid Username or Password!!";
      res.redirect("/admin");
    }
  });
});

router.get("/adminlogout", (req, res) => {
  req.session.admin=null;
  req.session.adminloggedIn = false;
  res.redirect("/admin");
});
/**Admin login section end here */

/**Admin Banner section  */
router.get('/banner', verifyLogin, async (req, res) => {
  let banners = await adminHelper.getALLBanners();
  res.render('admin/banner', { admin: true, banners });
});

router.post('/banner', (req, res) => {
  adminHelper.addBannerDetails(req.body).then((id) => {
      if (req.files && req.files.image) {
          let image = req.files.image;
          image.mv('./public/banner/' + id + '.jpg', (err) => {
              if (err) {
                  console.error("Error uploading image:", err);
              }
          });
      } else {
          console.log("No image uploaded");
      }

      console.log("Banner details added successfully");
      res.redirect('/admin/banner');
  });
});


router.get('/activate-banner/:id', verifyLogin, (req, res) => {
  let bannerId = req.params.id;
  adminHelper.activateBanner(bannerId).then(() => {
      res.redirect('/admin/banner');
  }).catch((err) => {
      console.error("Error activating banner:", err);
      res.redirect('/admin/banner'); // or handle error appropriately
  });
});


router.get('/delete-banner/:id', verifyLogin, (req, res) => {
  let bannerId = req.params.id;
  let imagePath = './public/banner/' + bannerId + '.jpg';

  adminHelper.deleteBanner(bannerId).then(() => {
      if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log("Deleted file:", imagePath);
      } else {
          console.log("File not found:", imagePath);
      }
      res.redirect('/admin/banner');
  }).catch((err) => {
      console.error("Error deleting banner:", err);
      res.redirect('/admin/banner'); // or handle error appropriately
  });
});


router.get('/edit-banner/:id', verifyLogin, async (req, res) => {
  try {
      let bannerDetail = await adminHelper.getBannerDetails(req.params.id);
      res.render('admin/edit-banner', { admin: true, bannerDetail });
  } catch (err) {
      console.error("Error fetching banner details:", err);
      res.redirect('/admin/banner'); // or handle error appropriately
  }
});

router.post('/edit-banner/:id', (req, res) => {
  let bannerId = req.params.id;

  adminHelper.updateBannerDetails(bannerId, req.body).then(() => {
      if (req.files && req.files.image) {
          let image = req.files.image;
          let imagePath = './public/banner/' + bannerId + '.jpg';
          
          image.mv(imagePath, (err) => {
              if (err) {
                  console.error("Error uploading image:", err);
              }
          });
      }
      res.redirect('/admin/banner');
  }).catch((err) => {
      console.error("Error updating banner details:", err);
      res.redirect('/admin/banner'); // or handle error appropriately
  });
});

/**Admin Banner section End here */

/**Admin About section  */
router.get('/aboutUs', verifyLogin, async (req, res) => {
  try {
      let aboutUsDetails = await adminHelper.getALLAboutUsDetails();
      res.render('admin/aboutUs', { admin: true, aboutUsDetails });
  } catch (err) {
      console.error("Error fetching about us details:", err);
      res.redirect('/admin/aboutUs'); // or handle error appropriately
  }
});

router.post('/aboutUs', (req, res) => {
  adminHelper.addAboutUsDetails(req.body).then((id) => {
      if (req.files && req.files.image) {
          let image = req.files.image;
          image.mv('./public/aboutUs/' + id + '.jpg', (err) => {
              if (err) {
                  console.error("Error uploading image:", err);
              }
          });
      }

      res.redirect('/admin/aboutUs');
  }).catch((err) => {
      console.error("Error adding about us details:", err);
      res.redirect('/admin/aboutUs'); // or handle error appropriately
  });
});

router.get('/activate-aboutUs/:id', verifyLogin, (req, res) => {
  let aboutUsId = req.params.id;
  adminHelper.activateAboutUs(aboutUsId).then(() => {
      res.redirect('/admin/aboutUs');
  }).catch((err) => {
      console.error("Error activating about us:", err);
      res.redirect('/admin/aboutUs'); // or handle error appropriately
  });
});

router.get('/delete-aboutUs/:id', verifyLogin, (req, res) => {
  let aboutUsId = req.params.id;
  let imagePath = './public/aboutUs/' + aboutUsId + '.jpg';

  adminHelper.deleteAboutUs(aboutUsId).then(() => {
      if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log("Deleted file:", imagePath);
      } else {
          console.log("File not found:", imagePath);
      }
      res.redirect('/admin/aboutUs');
  }).catch((err) => {
      console.error("Error deleting about us:", err);
      res.redirect('/admin/aboutUs'); // or handle error appropriately
  });
});

router.get('/edit-aboutUs/:id', verifyLogin, async (req, res) => {
  try {
      let aboutUsDetail = await adminHelper.getAboutUsDetails(req.params.id);
      res.render('admin/edit-aboutUs', { admin: true, aboutUsDetail });
  } catch (err) {
      console.error("Error fetching about us details for editing:", err);
      res.redirect('/admin/aboutUs'); // or handle error appropriately
  }
});

router.post('/edit-aboutUs/:id', (req, res) => {
  let aboutUsId = req.params.id;

  adminHelper.updateAboutUsDetails(aboutUsId, req.body).then(() => {
      if (req.files && req.files.image) {
          let image = req.files.image;
          let imagePath = './public/aboutUs/' + aboutUsId + '.jpg';

          image.mv(imagePath, (err) => {
              if (err) {
                  console.error("Error uploading image:", err);
              }
          });
      }
      res.redirect('/admin/aboutUs');
  }).catch((err) => {
      console.error("Error updating about us details:", err);
      res.redirect('/admin/aboutUs'); // or handle error appropriately
  });
});

/**Admin About section End here */

/**Admin Branch section  */
router.get('/branch', verifyLogin, async (req, res) => {
  try {
      let branchDetails = await adminHelper.getALLBranchDetails();
      res.render('admin/branch', { admin: true, branchDetails });
  } catch (err) {
      console.error("Error fetching branch details:", err);
      res.redirect('/admin/branch'); // or handle error appropriately
  }
});

router.post('/branch', (req, res) => {
  adminHelper.addBranchDetails(req.body).then((id) => {
      if (req.files && req.files.image) {
          let image = req.files.image;
          image.mv('./public/branch/' + id + '.jpg', (err) => {
              if (err) {
                  console.error("Error uploading image:", err);
              }
          });
      }

      res.redirect('/admin/branch');
  }).catch((err) => {
      console.error("Error adding branch details:", err);
      res.redirect('/admin/branch'); // or handle error appropriately
  });
});

router.get('/delete-branch/:id', verifyLogin, (req, res) => {
  let branchId = req.params.id;
  let imagePath = './public/branch/' + branchId + '.jpg';

  adminHelper.deleteBranch(branchId).then(() => {
      if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log("Deleted file:", imagePath);
      } else {
          console.log("File not found:", imagePath);
      }
      res.redirect('/admin/branch');
  }).catch((err) => {
      console.error("Error deleting branch:", err);
      res.redirect('/admin/branch'); // or handle error appropriately
  });
});

router.get('/edit-branch/:id', verifyLogin, async (req, res) => {
  try {
      let branchDetail = await adminHelper.getBranchDetails(req.params.id);
      res.render('admin/edit-branch', { admin: true, branchDetail });
  } catch (err) {
      console.error("Error fetching branch details for editing:", err);
      res.redirect('/admin/branch'); // or handle error appropriately
  }
});

router.post('/edit-branch/:id', (req, res) => {
  let branchId = req.params.id;

  adminHelper.updateBranchDetails(branchId, req.body).then(() => {
      if (req.files && req.files.image) {
          let image = req.files.image;
          let imagePath = './public/branch/' + branchId + '.jpg';

          image.mv(imagePath, (err) => {
              if (err) {
                  console.error("Error uploading image:", err);
              }
          });
      }
      res.redirect('/admin/branch');
  }).catch((err) => {
      console.error("Error updating branch details:", err);
      res.redirect('/admin/branch'); // or handle error appropriately
  });
});

/**Admin Branch section End here */


/**Admin Category section  */
router.get('/add-category', verifyLogin, async (req, res) => {
  try {
      let allCategory = await adminHelper.getALLCategory();
      res.render('admin/add-category', { admin: true, allCategory });
  } catch (err) {
      console.error("Error fetching categories:", err);
      res.redirect('/admin/add-category'); // or handle error appropriately
  }
});

router.post('/add-category', (req, res) => {
  adminHelper.addCategory(req.body).then((id) => {
      if (req.files && req.files.image) {
          let image = req.files.image;
          image.mv('./public/category/' + id + '.jpg', (err) => {
              if (err) {
                  console.error("Error uploading image:", err);
              }
          });
      }

      res.redirect('/admin/add-category');
  }).catch((err) => {
      console.error("Error adding category:", err);
      res.redirect('/admin/add-category'); // or handle error appropriately
  });
});
router.get('/delete-category/:id', verifyLogin, (req, res) => {
  let categoryId = req.params.id;
  let imagePath = './public/category/' + categoryId + '.jpg';

  adminHelper.deleteCategory(categoryId).then(() => {
      if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
      
      } else {
          console.log("File not found:", imagePath);
      }
      res.redirect('/admin/add-category');
  }).catch((err) => {
      console.error("Error deleting category:", err);
      res.redirect('/admin/add-category'); // or handle error appropriately
  });
});

router.get('/edit-category/:id', verifyLogin, async (req, res) => {
  try {
      let category = await adminHelper.getCategorytDetails(req.params.id);
      res.render('admin/edit-category', { category, admin: true });
  } catch (err) {
      console.error("Error fetching category details for editing:", err);
      res.redirect('/admin/add-category'); // or handle error appropriately
  }
});

router.post('/edit-category/:id', (req, res) => {
  let categoryId = req.params.id;

  adminHelper.updateCategory(categoryId, req.body).then(() => {
      if (req.files && req.files.image) {
          let image = req.files.image;
          let imagePath = './public/category/' + categoryId + '.jpg';

          image.mv(imagePath, (err) => {
              if (err) {
                  console.error("Error uploading image:", err);
              }
          });
      }
      res.redirect('/admin/add-category');
  }).catch((err) => {
      console.error("Error updating category:", err);
      res.redirect('/admin/add-category'); // or handle error appropriately
  });
});

/**Admin Category section End  */

/**Admin product section  */
router.get('/add-product', verifyLogin, async function(req, res) {
  try {
      let allCategory = await adminHelper.getALLCategory();
      if (!allCategory) {
          console.log("Categories not found");
      }
      res.render('admin/add-product', { admin: true, allCategory });
  } catch (err) {
      console.error("Error fetching categories:", err);
      res.redirect('/admin/add-product'); 
  }
});


router.post('/add-product', function(req, res) {
  adminHelper.addProduct(req.body).then((id) => {
      if (req.files) {
          if (req.files.image1) {
              let image1 = req.files.image1;
              image1.mv('./public/images/' + id + 'first.jpg', (err) => {
                  if (err) {
                      console.error("Error uploading image 1:", err);
                  }
              });
          }
          if (req.files.image2) {
              let image2 = req.files.image2;
              image2.mv('./public/images/' + id + 'second.jpg', (err) => {
                  if (err) {
                      console.error("Error uploading image 2:", err);
                  }
              });
          }
          if (req.files.image3) {
              let image3 = req.files.image3;
              image3.mv('./public/images/' + id + 'third.jpg', (err) => {
                  if (err) {
                      console.error("Error uploading image 3:", err);
                  }
              });
          }
          if (req.files.image4) {
              let image4 = req.files.image4;
              image4.mv('./public/images/' + id + 'fourth.jpg', (err) => {
                  if (err) {
                      console.error("Error uploading image 4:", err);
                  }
              });
          }
      }

      res.redirect('/admin/add-product');
  }).catch((err) => {
      console.error("Error adding product:", err);
      res.redirect('/admin/add-product'); 
  });
});


router.get("/all-products", verifyLogin, async (req, res) => {
  try {
      const products = await adminHelper.getALLProducts();
      res.render('admin/all-products', { products, admin: true });
  } catch (error) {
      console.error('Error fetching all products:', error);
      res.redirect('/admin/all-products'); 
  }
});


router.get('/delete-product/:id', async (req, res) => {
  let proId = req.params.id;

  try {
      // Ensure product exists before attempting to delete
      const product = await adminHelper.deleteProduct(proId);
      if (!product) {
        res.redirect('/admin/all-products'); 
      }

      // Array to store unlink promises
      const unlinkPromises = [];

      // Function to asynchronously unlink files
      async function unlinkIfExists(filePath) {
          try {
              await fs.unlink(filePath);
             
          } catch (err) {
              if (err.code === 'ENOENT') {
                  console.warn(`File ${filePath} not found.`);
              } else {
                  throw err; // Throw error if unlink fails for other reasons
              }
          }
      }

      // Push unlink promises for each file
      unlinkPromises.push(unlinkIfExists(`./public/images/${proId}first.jpg`));
      unlinkPromises.push(unlinkIfExists(`./public/images/${proId}second.jpg`));
      unlinkPromises.push(unlinkIfExists(`./public/images/${proId}third.jpg`));
      unlinkPromises.push(unlinkIfExists(`./public/images/${proId}fourth.jpg`));

      // Wait for all unlink promises to complete
      await Promise.all(unlinkPromises);

      // After deletion, redirect to all-products page
      res.redirect('/admin/all-products');
  } catch (error) {
      console.error('Error deleting product or images:', error);
      res.redirect('/admin/all-products');
  }
});

router.get('/edit-product/:id',verifyLogin,async(req,res)=>{
  allCategory=await adminHelper.getALLCategory()
  adminHelper.getProductDetails(req.params.id).then((product)=>{
    res.render('admin/edit-product',{product,admin:true,allCategory});
  })  
})

router.post('/edit-product/:id', (req, res) => {
  adminHelper.updateProduct(req.params.id, req.body).then((response) => {
    if (req.files) {
      if (req.files.image) {
        let image = req.files.image;
        image.mv('./public/images/' + req.params.id + 'first.jpg');
      }
      if (req.files.image2) {
        let image2 = req.files.image2;
        image2.mv('./public/images/' + req.params.id + 'second.jpg');
      }
      if (req.files.image3) {
        let image3 = req.files.image3;
        image3.mv('./public/images/' + req.params.id + 'third.jpg');
      }
      if (req.files.image4) {
        let image4 = req.files.image4;
        image4.mv('./public/images/' + req.params.id + 'fourth.jpg');
      }
    }
    res.redirect('/admin/all-products');
  }).catch((err) => {
    console.error(err);
    res.redirect('/admin/all-products'); // Handle errors appropriately
  });
});

/**Admin Product section End */



/**Admin Customer section  */
router.get("/all-customers", verifyLogin,async(req, res) => {
  adminHelper.getALLCustomers().then((customers)=>{
  res.render('admin/all-customers',{customers,admin:true})
})
});
router.get('/add-customer',verifyLogin,async function(req,res){
  allCategory=await adminHelper.getALLCategory()
  res.render('admin/add-customer',{admin:true,allCategory})
})

//====================================================================================================

router.get('/users-list',verifyLogin,async(req,res)=>{
  userlist=await adminHelper.getALLusers()
  res.render('admin/users-list',{userlist,admin:true})
})

router.get('/delete-user/:id',(req,res)=>{
  let userId=req.params.id

  adminHelper.deleteUser(userId).then((response)=>{
    const pathToFile = './public/profile/'+userId+'.jpg'
    if (fs.existsSync(pathToFile)) {
    fs.unlink(pathToFile, function (err) {
      if (err) {
        throw err;
      } else {
        console.log("Successfully deleted the file.");
      }
    });
    res.redirect('/admin/users-list')
  }else{
    res.redirect('/admin/users-list')
  }
  })
})

router.get('/block-user/:id',(req,res)=>{
  userId=req.params.id
  adminHelper.blockUser(userId).then(()=>{
    res.redirect('/admin/users-list')
  })
})
router.get('/unblock-user/:id',(req,res)=>{
  userId=req.params.id
  adminHelper.unblockUser(userId).then(()=>{
    res.redirect('/admin/users-list')
  })
})

router.get('/view-orders',verifyLogin,async(req,res)=>{
  orders=await adminHelper.getALLOrders()
  res.render('admin/view-orders',{orders,admin:true})
})
router.get('/view-order-items/:id',verifyLogin,async(req,res)=>{
  orderProductDetails=await adminHelper.getOrderproduct(req.params.id);
  res.render('admin/view-order-items',{admin:true,orderProductDetails})
})

router.get('/delete-order/:id', verifyLogin, (req, res) => {
  let orderId = req.params.id;
  adminHelper.deleteOrder(orderId).then(() => {
      res.redirect('/admin/view-orders');
  }).catch((err) => {
      console.error("Error deleting orders:", err);
      res.redirect('/admin/view-orders'); // or handle error appropriately
  });
});

module.exports = router;
