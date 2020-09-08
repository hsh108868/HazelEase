const fn = require("../lib/other"); // 정의된 함수들 가져오기

/* ------------------------------ wishlist에 있는 제품 출력 ------------------------------ */
exports.show = function(req, res) {
  const user_id = req.session.user_id;

  if (!req.session.loggedin) {
    res.redirect("/login");
    res.end();
  } else {
    sql = `select a.product_id, a.product, a.price, a.rating, b.wishlist_id, b.user_id
           from product as a
              right outer join wishlist as b on a.product_id = b.product_id where b.user_id = ?;

           select * from image; `
    db.query(sql,
      [user_id],
      function(err, results, fields) {
        if (err) throw err;
        res.render('wishlist.ejs', {
          user_id: user_id,
          data: results[0],
          images: results[1],
          formatNum: fn.formatNum,
          sess: req.session
        });
      });
  }
};

/* ------------------------------ wishlist에 항목 추가 처리 ------------------------------ */
exports.add = function(req, res) {
  const user_id = req.session.user_id;
  let reqProductId = req.params.productId;
  var now = new Date();

  console.log(req.header);

  if (!req.session.loggedin) {
    res.redirect("/login");
    res.end();
  } else {
    db.query('SELECT product_id FROM wishlist WHERE product_id = ? AND user_id = ?', [reqProductId, user_id], function(err, results) {
      if (err) throw err;
      if (results.length == 0) {
        var sql = 'insert into wishlist(user_id, product_id, date) values (?,?,?);';
        var params = [user_id, reqProductId, now];
        db.query(sql, params, function(err, results) {
          if (err) {
            res.send('실패');
            throw err;
          }
        });
      }
      res.redirect('/product/' + reqProductId);
    });
  }
}
/* 오류 발생시 product auto_increment 초기화
   alter table wishlist auto_increment=1;
 */

/* ------------------------------ wishlist에세 항목 삭제 처리 ------------------------------ */
exports.delete = function(req, res) {
  const user_id = req.session.user_id;
  var reqWishlistId = req.params.wishlistId;
  var reqProductId = req.params.productId;

  var sql = 'DELETE FROM wishlist WHERE ';
  var params = [];
  if (reqWishlistId) {
    sql += 'wishlist_id = ?; '
    params = [reqWishlistId];
  } else {
    sql += 'product_id = ? AND user_id = ?; '
    params = [reqProductId, user_id];
  }

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

      if (reqWishlistId) {
        res.redirect('/my-wishlist');
      } else {
        res.redirect('/product/' + reqProductId);
      }
    })
  }
}

/* ------------------------------ wishlist에서 cart로 담기 처리 ------------------------------ */
exports.move = function(req, res) {
  const user_id = req.session.user_id;
  let reqWishlistId = req.params.wishlistId;
  let reqProductId = req.params.productId;
  var now = new Date();

  var productId = 0;

  if (!req.session.loggedin) {
    res.redirect("/login");
    res.end();
  } else {
    var sql = `DELETE FROM wishlist WHERE wishlist_id = ?;`
    var params = [reqWishlistId];
    db.query(sql, params, function(err, results) {
      if (err) {
        console.log('쇼핑카트 담기에 실패');
        throw err;
      }
      req.session.notice = "종류와 매장을 선택하세요."
      res.redirect('/product/' + reqProductId);
    });
  }
}
