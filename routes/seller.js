const fn = require("../lib/other"); // 정의된 함수들 가져오기

/* ------------------------------ 판매자 정보 업데이트/등록 ------------------------------ */
exports.manageInfo = function(req, res) {
  user_id = req.session.user_id;
  req.session.openForm = 0;

  var post = {
    seller_id: user_id,
    name: req.body.sellerName,
    address: req.body.sellerAddress,
    phone: req.body.sellerPhone,
    email: req.body.sellerEmail
  }

  db.query('SELECT * FROM ?? WHERE seller_id = ?', ['seller', user_id], function(err0, results, fields) {
    if (err0) throw err0;
    if (results.length > 0) {
      db.query('UPDATE seller SET name = ?, address = ?, phone = ?, email = ? WHERE seller_id = ?', [post.name, post.address, post.phone, post.email, user_id], function(err1, resultsA, fields) {
        if (err1) throw err1;
        req.session.message = "정보 변경이 저장되었습니다.";
        res.redirect("/account/seller-management");
      });
    } else {
      db.query('INSERT INTO seller SET ?', post, function(err2, resultsB, fields) {
        if (err2) throw err2;
        req.session.message = "판매자로 계정을 성공적으로 등록하였습니다.";
        res.redirect("/account/seller-management");
      });
    }
  });
}

/* ------------------------------ 판매하는 제품 추가 / 정보 수정 처리 ------------------------------ */
exports.manageProduct = function(req, res) {
  user_id = req.session.user_id;
  req.session.openForm = 1;

  var post = {
    product: req.body.productName,
    type_avail: req.body.productType,
    info: req.body.productDesc,
    price: req.body.productPrice,
    discount: req.body.productDisc,
    seller_id: user_id,
    rating: 0,
    category: req.body.productCategory
  }

  if (req.files) {
    productImages = req.files.photos;
  } else {
    productImages = [];
  }

  var sql = "";
  var params = [];
  var max = 10;

  // 이미지 10개 이상 차단
  if (req.session.openProductInfo.noOfImg != "") {
    max = 10 - eval(req.session.openProductInfo.noOfImg);
  }

  if (productImages.length > max) {
    req.session.messageErr = "제품의 이미지가 10 개 이상 불가능합니다.";
    res.redirect("/account/seller-management");
    return;
  }

  //모든 사진 서버에 저장
  if (req.files) {
  fn.fileUpload(req, res);
  }

  if (req.session.openProductInfo.product_id == "") {
    db.query('INSERT INTO product SET ?', post, function(err, results, fields) {
      if (err) throw err;
      let product_id = results.insertId;

      if (productImages.length > 1) { //여러 파일 업로드하는 경우
        // 쿼리 반복
        productImages.forEach(function(image) {
          sql += 'INSERT INTO image SET file = ?, product_id = ?; '
          params.push(image.name);
          params.push(product_id);
        });

      } else { // 파일 하나만 업로드하는 경우
        sql = 'INSERT INTO image SET file = ?, product_id = ?; '
        params = [productImages.name, product_id];
      }

      db.query(sql, params, function(err1, results1, fields1) {
        if (err1) throw err;
        req.session.message = "새 제품을 성공적으로 등록하였습니다.";
        res.redirect("/account/seller-management");
      });
    });
  } else {
    sql = `UPDATE product SET product = ?, type_avail = ?, info = ?, price = ?,
           discount = ?, seller_id = ?, category = ? WHERE product_id = ?; `
    params = [post.product, post.type_avail, post.info, post.price, post.discount,
              post.seller_id, post.category, req.session.openProductInfo.product_id];
    db.query(sql, params, function(err, results, fields) {
      if (err) throw err;
      let product_id = req.session.openProductInfo.product_id;

      if (productImages.length == 0) {
        req.session.message = "제품 정보 변경이 저장도었습니다.";
        req.session.openProductInfo = null;
        res.redirect("/account/seller-management");
        return;
      } else if (productImages.length > 1) { //여러 파일 업로드하는 경우
        sql = "";
        params = [];

        // 쿼리 반복
        productImages.forEach(function(image) {
          sql += 'INSERT INTO image SET file = ?, product_id = ?; '
          params.push(image.name);
          params.push(product_id);
        });

      } else { // 파일 하나만 업로드하는 경우
        sql = 'INSERT INTO image SET file = ?, product_id = ?; '
        params = [productImages.name, product_id];
      }

      db.query(sql, params, function(err1, results1, fields1) {
        if (err1) throw err;
        req.session.message = "제품 정보 변경이 저장도었습니다.";
        req.session.openProductInfo = null;
        res.redirect("/account/seller-management");
      });
    });
  }
}
/* ------------------------------ 판매하는 제품 정보 여는 처리 ------------------------------ */
exports.openProductInfo = function(req, res) {
  var reqProductId = req.params.productId;
  req.session.openForm = 1;

  sql = `SELECT * FROM product WHERE product_id = ?;
         SELECT * FROM image WHERE product_id = ?; `
  params = [reqProductId, reqProductId];
  db.query(sql, params, function(err, results) {
    req.session.openProductInfo = results[0][0];
    req.session.openProductInfo.noOfImg = results[1].length;
    req.session.openProductInfo.images = [];

    results[1].forEach(function(e) {
      req.session.openProductInfo.images.push(e);
    });
    res.redirect('/account/seller-management');
  });
}

/* ------------------------------ 판매하는 제품 정보 닫는 처리 ------------------------------ */
exports.closeProductInfo = function(req, res) {
  req.session.openForm = 1;
  req.session.openProductInfo = null;
  res.redirect('/account/seller-management');
}

/* ------------------------------ 제품 삭제 처리 ------------------------------ */
exports.deleteProduct = function(req, res) {
  var reqProductId = req.params.productId;
  req.session.openForm = 1;

  var sql = `DELETE FROM product WHERE product_id = ?;
             DELETE FROM stock WHERE product_id = ?;
             DELETE FROM image WHERE product_id = ?`;
  var params = [reqProductId, reqProductId, reqProductId];

  db.query(sql, params, function(err, results) {
    req.session.message = "제품이 삭제되었습니다.";
    res.redirect('/account/seller-management');
  });
}

/* ------------------------------ 제품의 이미지 삭제 처리 ------------------------------ */
exports.deleteImage = function(req, res) {
  var reqImageId = req.params.imageId;
  req.session.openForm = 1;
  req.session.openProductInfo.images = [];

  var sql = `DELETE FROM image WHERE image_id = ?;
             SELECT * FROM image WHERE product_id = ?; `
  var params = [reqImageId, req.session.openProductInfo.product_id];

  db.query(sql, params, function(err, results) {
    req.session.message = "이미지가 삭제되었습니다.";
    req.session.openProductInfo.noOfImg = results[1].length;

    results[1].forEach(function(e) {
      req.session.openProductInfo.images.push(e);
    });
    res.redirect('/account/seller-management');
  });
}

/* ------------------------------ 매장 등록 / 정보 수정 처리 ------------------------------ */
exports.manageShop = function(req, res) {
  user_id = req.session.user_id;
  req.session.openForm = 2;

  var post = {
    shop: req.body.shopName,
    phone: req.body.shopPhone,
    address: req.body.shopAddress,
    seller_id: user_id
  }

  if (req.session.openShopInfo.shop_id == "") {
    db.query('INSERT INTO shop SET ?', post, function(err, results, fields) {
      if (err) throw err;
      req.session.message = "새 매장을 성공적으로 등록하였습니다.";
      res.redirect("/account/seller-management");
    });
  } else {
    sql = `UPDATE shop SET shop = ?, address = ?, phone = ? WHERE shop_id = ?; `
    params = [post.shop, post.address, post.phone, req.session.openShopInfo.shop_id];
    db.query(sql, params, function(err, results, fields) {
      if (err) throw err;
      req.session.message = "매장 정보 변경이 저장도었습니다.";
      req.session.openShopInfo = null;
      res.redirect("/account/seller-management");
    });
  }
}

/* ------------------------------ 매장 정보 여는 처리 ------------------------------ */
exports.openShopInfo = function(req, res) {
  var reqShopId = req.params.shopId;
  req.session.openForm = 2;

  db.query('SELECT * FROM shop WHERE shop_id = ?', [reqShopId], function(err, results) {
    req.session.openShopInfo = results[0];
    res.redirect('/account/seller-management');
  });
}

/* ------------------------------ 판매하는 제품 정보 닫는 처리 ------------------------------ */
exports.closeShopInfo = function(req, res) {
  req.session.openForm = 2;
  req.session.openShopInfo = null;
  res.redirect('/account/seller-management');
}

/* ------------------------------ 제품 삭제 처리 ------------------------------ */
exports.deleteShop = function(req, res) {
  var reqShopId = req.params.shopId;
  req.session.openForm = 2;

  var sql = `DELETE FROM shop WHERE shop_id = ?;
             DELETE FROM stock WHERE shop_id = ?;`
  var params = [reqShopId, reqShopId];

  db.query(sql, params, function(err, results) {
    req.session.message = "매장이 삭제되었습니다.";
    res.redirect('/account/seller-management');
  });
}

/* ------------------------------ 해당 매장의 재고품 보여주는 처리 ------------------------------ */
exports.showStocks = function(req, res) {
  var reqShopId = req.params.shopId;
  req.session.selectedShop = reqShopId;
  req.session.openForm = 3;
  res.redirect("/account/seller-management");
}

/* ------------------------------ 재고품 추가 처리 ------------------------------ */
exports.addStock = function(req, res) {
  user_id = req.session.user_id;
  shop_id = req.body.shopId;
  product_id = req.body.productId;
  req.session.openForm = 3;
  req.session.selectedShop = shop_id;

  var post = {
    shop_id: shop_id,
    product_id: product_id,
    quantity: req.body.productQty,
    seller_id: user_id
  }

  if (shop_id == 0) {
    req.session.messageErr = "매장을 선택하세요!";
    res.redirect("/account/seller-management");
  } else if (product_id == "") {
    req.session.messageErr = "매장에 추가할 제품을 선택하세요!";
    res.redirect("/account/seller-management");
  } else {
    db.query('INSERT INTO stock SET ?', post, function(err, results) {
      if (err) throw err;
      req.session.message = "제품(ID: " + product_id + ")을 매장(ID: " + shop_id + ")에 성공적으로 등록하였습니다.";
      res.redirect("/account/seller-management");
    });
  }
}

/* ------------------------------ 재고품 업데이트 처리 ------------------------------ */
exports.updateStock = function(req, res) {
  var reqProductId = req.params.productId;
  var reqShopId = req.params.shopId;
  var reqProductQty = req.params.productQty;
  req.session.openForm = 3;

  sql = `UPDATE stock SET quantity = ? WHERE product_id = ? AND shop_id = ?; `
  params = [reqProductQty, reqProductId, reqShopId];
  db.query(sql, params, function(err, results, fields) {
    if (err) throw err;
    req.session.message = "해당 제품의 수량을 저장하였습니다.";
    res.redirect("/account/seller-management");
  });

}

/* ------------------------------ 제품 삭제 처리 ------------------------------ */
exports.deleteStock = function(req, res) {
  var reqProductId = req.params.productId;
  var reqShopId = req.params.shopId;
  req.session.openForm = 3;

  var sql = `DELETE FROM stock WHERE product_id = ? AND shop_id = ?;`
  var params = [reqProductId, reqShopId];

  db.query(sql, params, function(err, results) {
    req.session.message = "해당 재고품이 삭제되었습니다.";
    res.redirect('/account/seller-management');
  });
}

/* ------------------------------ 쿠폰 발행 / 정보 수정 처리 ------------------------------ */
exports.manageCoupon = function(req, res) {
  user_id = req.session.user_id;
  req.session.openForm = 4;

  var post = {
    coupon_code: req.body.couponCode,
    value: req.body.couponValue,
    min_spend: req.body.couponMinSpend,
    effective_date: req.body.couponStart,
    expiry_date: req.body.couponEnd,
    seller_id: user_id
  }

  if (req.session.openCouponInfo.coupon_code == "") {
    db.query('INSERT INTO coupon SET ?', post, function(err, results, fields) {
      if (err) throw err;
      req.session.message = "새 쿠폰을 성공적으로 발행하였습니다.";
      res.redirect("/account/seller-management");
    });
  } else {
    sql = `UPDATE coupon SET value = ?, min_spend = ?, effective_date = ?, expiry_date = ?, seller_id = ? WHERE coupon_code = ?; `
    params = [post.value, post.min_spend, post.effective_date, post.expiry_date, post.seller_id, req.session.openCouponInfo.coupon_code];
    db.query(sql, params, function(err, results, fields) {
      if (err) throw err;
      req.session.message = "쿠폰 정보 변경이 저장도었습니다.";
      req.session.openCouponInfo = null;
      res.redirect("/account/seller-management");
    });
  }
}
/* ------------------------------ 발행된 쿠폰 정보 여는 처리 ------------------------------ */
exports.openCouponInfo = function(req, res) {
  var reqCouponCode = req.params.couponCode;
  req.session.openForm = 4;

  db.query('SELECT * FROM coupon WHERE coupon_code = ?', [reqCouponCode], function(err, results) {
    req.session.openCouponInfo = results[0];

    var sd = results[0].effective_date;
    var ed = results[0].expiry_date;
    var sYYYY, sMM, sDD, eYYYY, eMM, eDD;

    sYYYY = sd.getFullYear();
    if (sd.getMonth() < 9) {
      sMM = '0' + (sd.getMonth() + 1).toString();
    } else {
      sMM = (sd.getMonth() + 1).toString();
    }

    if (sd.getDate() <= 9) {
      sDD = '0' + sd.getDate().toString();
    } else {
      sDD = sd.getDate().toString();
    }

    eYYYY = ed.getFullYear();
    if (ed.getMonth() < 9) {
      eMM = '0' + (ed.getMonth() + 1).toString();
    } else {
      eMM = (ed.getMonth() + 1).toString();
    }

    if (ed.getDate() <= 9) {
      eDD = '0' + ed.getDate().toString();
    } else {
      eDD = ed.getDate().toString();
    }

    req.session.couponValidPeriod = {
      effectiveDate: sYYYY + '-' + sMM + '-' + sDD,
      expiryDate: eYYYY + '-' + eMM + '-' + eDD
    }

    res.redirect('/account/seller-management');
  });
}

/* ------------------------------ 발행된 쿠폰 정보 정보 닫는 처리 ------------------------------ */
exports.closeCouponInfo = function(req, res) {
  req.session.openForm = 4;
  req.session.openCouponInfo = null;
  res.redirect('/account/seller-management');
}

/* ------------------------------ 쿠폰 삭제 처리 ------------------------------ */
exports.deleteCoupon = function(req, res) {
  var reqCouponCode = req.params.couponCode;
  req.session.openForm = 4;

  var sql = `DELETE FROM coupon WHERE coupon_code = ?;`
  var params = [reqCouponCode];

  db.query(sql, params, function(err, results) {
    req.session.message = "쿠폰이 삭제되었습니다.";
    res.redirect('/account/seller-management');
  });
}

/* ------------------------------ 판매자 탈퇴 처리 ------------------------------ */
exports.withdraw = function(req, res) {
  var user_id = req.session.user_id;
  var sql = `DELETE FROM seller WHERE seller_id = ?;
             DELETE FROM product WHERE seller_id = ?
             DELETE FROM shop WHERE seller_id = ?;
             DELETE FROM stock WHERE seller_id = ?;
             DELETE FROM coupon WHERE seller_id = ?; `
  var params = [user_id, user_id, user_id, user_id, user_id];
  db.query(sql, params, function(err, results) {
    req.session.message = "판매자 서비스에서 성공적으로 탈퇴하였습니다. 서비스를 이용해 주셔서 갑사합니다.";
    res.redirect('/account/seller-management');
  });
}
