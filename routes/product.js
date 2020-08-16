const fn = require("../lib/other"); // 정의된 함수들 가져오기

/* ------------------------------ product의 상세정보 출력 ------------------------------ */
exports.showDetails = function(req, res) {
  const user_id = req.session.user_id;
  var message = req.session.message;
  const reqProductId = req.params.productId;

  db.query('SELECT * FROM ?? WHERE product_id = ?', ['product', reqProductId], function(err, results, fields) {
    if (err) throw err;
    if (results.length > 0) { // 제품 아이디가 존재하는 경우
      message = "요청한 제품의 정보가 여기입니다.";
      res.render('product.ejs', {
        user_id: user_id,
        data: results,
        message: message
      });
    } else { // 제품 아이디가 없는 경우
      message = "요청한 제품의 정보가 없습니다.";
      res.render('product.ejs', {
        user_id: user_id,
        message: message
      });
    }
  });
};

/* ------------------------------ home화면 product 출력 ------------------------------ */
exports.showOutlines = function(req, res) {
  const user_id = req.session.user_id;
  db.query('select * from product;', function(err, results, fields) {
    if (err) throw err;
    res.render('home.ejs', {
      user_id: user_id,
      product: results,
      formatNum: fn.formatNum
    });
  });
};

/* ------------------------------ cart에 있는 제품 출력 ------------------------------ */
exports.showMyCart = function(req, res) {
  var user_id = req.session.user_id;

  if (!req.session.loggedin) {
    res.redirect("/login");
    res.end();
  } else {
    sql = `SELECT p.product, p.price, p.rating, p.type_avail, c.cart_id, c.quantity, c.user_id
           FROM product AS p RIGHT OUTER JOIN cart AS c
           ON p.product_id = c.product_id
           WHERE c.user_id = ?`
    params = [user_id]
    db.query(sql, params, function(err, results, fields) {
      if (err) throw err;
      res.render('cart.ejs', {
        user_id: user_id,
        data: results,
        formatNum: fn.formatNum
      });
    });
  }
};

/* ------------------------------ cart에 항목 추가 처리 ------------------------------ */
exports.cartAdd = function(req, res) {
  const user_id = req.session.user_id;
  let reqProductId = req.params.productId;
  var now = new Date();

  var sql = 'insert into cart(user_id, product_id, date, quantity) values (?,?,?,?);';
  var params = [user_id, reqProductId, now, '1'];
  if (!req.session.loggedin) {
    res.redirect("/login");
    res.end();
  } else {
    db.query(sql, params, function(err, results) {
      if (err) {
        res.send('쇼핑카트에 항목 추가에 실패');
        throw err;
      } else {
        console.log(results);
      }
      res.redirect('/my-cart');
    })
  }
}
/* 오류 발생시 product auto_increment 초기화
 * alter table cart auto_increment=1;
 */

/* ------------------------------ cart에세 항목 삭제 처리 ------------------------------ */
exports.cartDelete = function(req, res) {
  var reqCartId = req.params.cartId;

  var sql = 'delete from cart where cart_id=?;';
  var params = [reqCartId];
  if (!req.session.loggedin) {
    res.redirect("/login");
    res.end();
  } else {
    db.query(sql, params, function(err, results) {
      if (err) {
        res.send('쇼핑카트에 항목 삭제에 실패');
        throw err;
      } else {
        console.log("성공적으로 삭제되었습니다.");
      }
      res.redirect('/my-cart');
    })
  }
}

/* ------------------------------ wishlist에 있는 제품 출력 ------------------------------ */
exports.showMyWishlist = function(req, res) {
  const user_id = req.session.user_id;

  if (!req.session.loggedin) {
    res.redirect("/login");
    res.end();
  } else {
    db.query('select a.product, a.price, a.rating, b.wishlist_id, b.user_id from product as a right outer join wishlist as b on a.product_id = b.product_id where b.user_id = ?',
      [user_id], function(err, results, fields) {
      if (err) throw err;
      res.render('wishlist.ejs', {
        user_id: user_id,
        data: results,
        formatNum: fn.formatNum
      });
    });
  }
};

/* ------------------------------ wishlist에 항목 추가 처리 ------------------------------ */
exports.wishlistAdd = function(req, res) {
  const user_id = req.session.user_id;
  let reqProductId = req.params.productId;
  var now = new Date();

  var sql = 'insert into wishlist(user_id, product_id, date) values (?,?,?);';
  var params = [user_id, reqProductId, now];
  if (!req.session.loggedin) {
    res.redirect("/login");
    res.end();
  } else {
    db.query(sql, params, function(err, results) {
      if (err) {
        res.send('send error');
        throw err;
      } else {
        console.log(results);
      }
      res.redirect('/my-wishlist');
    })
  }
}
/* 오류 발생시 product auto_increment 초기화
   alter table wishlist auto_increment=1;
 */

/* ------------------------------ wishlist에세 항목 삭제 처리 ------------------------------ */
 exports.wishlistDelete = function(req, res) {
   var reqWishlistId = req.params.wishlistId;

   var sql = 'delete from wishlist where wishlist_id=?;';
   var params = [reqWishlistId];
   if (!req.session.loggedin) {
     res.redirect("/login");
     res.end();
   } else {
     db.query(sql, params, function(err, results) {
       if (err) {
         res.send('위시리스트 항목 삭제에 실패');
         throw err;
       } else {
         console.log("성공적으로 삭제되었습니다.");
       }
       res.redirect('/my-wishlist');
     })
   }
 }
