const ip = require("ip");
const mysql = require("mysql");
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const XLSX = require("xlsx");
const multer = require("multer");

const port = process.env.PORT || 8888;
const dbhost = process.env.dbhost || "localhost";
const dbuser = process.env.dbuser || "root";
const dbpassword = process.env.dbpassword || "12345678";
const dbname = process.env.dbname || "nodelogin";

const connection = mysql.createConnection({
  host: dbhost,
  user: dbuser,
  password: dbpassword,
  database: dbname,
});

var app = express();
app.use(
  cors({
    origin: ["http://localhost:" + port, "http://127.0.0.1:" + port],
    credentials: true,
  })
);
app.use(function (req, res, next) {
  res.header(
    "Access-Control-Allow-Origin",
    "http://localhost:" + port + "/api/get_classes"
  );
  res.header("Access-Control-Allow-Headers", true);
  res.header("Access-Control-Allow-Credentials");
  res.header("Access-Control-Allow-Methods", "GET, POST");
  next();
});
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "/html")));
app.use(express.static(path.join(__dirname, "/css")));
app.use(express.static(path.join(__dirname, "/libs")));
app.use("/img", express.static(path.join(__dirname, "/img")));
app.listen(port);

// CONFIGURATIONs
console.log(`Server started at ${ip.address()}:${port}`);

///////////////////////////////////////////////////////////////////////////////
// SERVINGs
///////////////////////////////////////////////////////////////////////////////
app.get("/", function (req, res) {
  // Render login template
  res.sendFile(path.join(__dirname + "/html/login.html"));
});

app.post("/auth", function (req, res) {
  // Capture the input fields
  let username = req.body.username;
  let password = req.body.password;
  // Ensure the input fields exists and are not empty
  if (username && password) {
    // Execute SQL query that'll select the account from the database based on the specified username and password
    connection.query(
      "SELECT * FROM accounts WHERE username = ? AND password = ?",
      [username, password],
      function (error, results, fields) {
        // If there is an issue with the query, output the error
        if (error) throw error;
        // If the account exists
        if (results.length > 0) {
          // Authenticate the user
          req.session.loggedin = true;
          req.session.username = username;
          // Redirect to menu/setting page
          res.redirect("/menu");
        } else {
          res.send("T??n ????ng nh???p ho???c M???t kh???u kh??ng ????ng!");
          res.end();
        }
      }
    );
  } else {
    res.send("H??y nh???p T??n ????ng nh???p v?? M???t kh???u!");
    res.end();
  }
});

app.get("/menu", function (req, res) {
  // If the user is loggedin
  if (req.session.loggedin) {
    res.sendFile(path.join(__dirname + "/html/menu.html"));
  } else {
    // Not logged in
    res.statusCode = 400;
    res.end(`
    <html>
      <head>
        <meta charset="utf-8">
      </head>
        <body>
        B???n ch??a ????ng nh???p. <br/>
        <form action="/">
            <input type="submit" value="OK" />
        </form>
      </body>
    </html>`);
  }
  // res.end();
});

app.get("/ktgs-thi", function (req, res) {
  // If the user is loggedin
  if (req.session.loggedin) {
    res.sendFile(path.join(__dirname + "/html/ktgs-thi.html"));
  } else {
    // Not logged in
    res.statusCode = 400;
    res.end(`
    <html>
      <head>
        <meta charset="utf-8">
      </head>
        <body>
        B???n ch??a ????ng nh???p. <br/>
        <form action="/">
            <input type="submit" value="OK" />
        </form>
      </body>
    </html>`);
  }
});
app.get("/ktgs-thvd", function (req, res) {
  // If the user is loggedin
  if (req.session.loggedin) {
    res.sendFile(path.join(__dirname + "/html/ktgs-thvd.html"));
  } else {
    // Not logged in
    res.statusCode = 400;
    res.end(`
    <html>
      <head>
        <meta charset="utf-8">
      </head>
        <body>
        B???n ch??a ????ng nh???p. <br/>
        <form action="/">
            <input type="submit" value="OK" />
        </form>
      </body>
    </html>`);
  }
});

app.get("/setting", function (req, res) {
  if (req.session.loggedin) {
    sess = req.session;
    if (sess.username != "admin") {
      res.send("Ch??? Admin m???i xem ???????c trang n??y!");
      res.end();
    }
    res.sendFile(path.join(__dirname, "/html/setting.html"));
  } else {
    // Not logged in
    res.statusCode = 400;
    res.end(`
    <html>
      <head>
        <meta charset="utf-8">
      </head>
        <body>
        B???n ch??a ????ng nh???p. <br/>
        <form action="/">
            <input type="submit" value="OK" />
        </form>
      </body>
    </html>`);
  }
});

// Logout
app.get("/logout", function (req, res, next) {
  req.session.destroy(function (err) {
    res.redirect("/");
  });
});

///////////////////////////////////////////////////////////////////////////////
// APIs
///////////////////////////////////////////////////////////////////////////////
// add_user
app.post("/api/add_user", function (req, res) {
  if (!req.session.loggedin) {
    res.statusCode = 400;
    res.end("Login first!");
    return;
  }
  const user = req.body;
  if (!user.username || !user.password) {
    res.statusCode = 400;
    res.end(`
    <html>
      <head>
        <meta charset="utf-8">
      </head>
        <body>
        H??y nh???p t??n ????ng nh???p v?? m???t kh???u. <br/>
        <form action="/setting">
            <input type="submit" value="OK" />
        </form>
      </body>
    </html>`);
  }
  connection.query(
    "INSERT INTO accounts (`username`, `password`) VALUES (?, ?)",
    [user.username, user.password],
    function (error, results, fields) {
      // console.log("adding user");
      // If there is an issue with the query, output the error
      if (error) {
        if (error.code === "ER_DUP_ENTRY") {
          console.log(error);
          res.statusCode = 400;
          res.end(`
          <html>
            <head>
              <meta charset="utf-8">
            </head>
              <body>
                T??i kho???n ???? t???n t???i, vui l??ng ch???n l???i T??n ????ng nh???p. <br/>
              <form action="/setting">
                  <input type="submit" value="OK" />
              </form>
            </body>
          </html>`);
          return;
        } else {
          console.log(error);
          throw error;
        }
      }
      // If success
      if (results.affectedRows > 0) {
        res.statusCode = 200;
        res.end(`
          <html>
            <head>
              <meta charset="utf-8">
            </head>
              <body>
                T???o t??i kho???n th??nh c??ng. <br/>
              <form action="/setting">
                  <input type="submit" value="OK" />
              </form>
            </body>
          </html>`);
      } else {
        res.statusCode = 500;
        res.end(results);
      }
    }
  );
});

const excelFilter = (req, file, cb) => {
  if (
    file.mimetype.includes("excel") ||
    file.mimetype.includes("spreadsheetml")
  ) {
    cb(null, true);
  } else {
    cb("Ch??? ch???p nh???n file excel.", false);
  }
};
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, __dirname + "/uploads/studentLists/");
  },
  filename: (req, file, cb) => {
    // console.log(file.originalname);
    cb(null, file.originalname);
  },
});
var storage_att = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, __dirname + "/uploads/attachments/");
  },
  filename: (req, file, cb) => {
    // console.log(file.originalname);
    cb(null, file.originalname);
  },
});
var upload = multer({ storage: storage, fileFilter: excelFilter });
function isNumeric(value) {
  return /^-?\d+$/.test(value);
}
// import_classes
app.post(
  "/api/import_classes",
  upload.single("studentList"),
  function (req, res, next) {
    if (!req.session.loggedin) {
      res.statusCode = 400;
      res.end("Login first!");
      return;
    }
    const file = req.file;
    if (!file) {
      res.statusCode = 400;
      res.end(`
        <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body>
              H??y ch???n file. <br/>
              <form action="/setting">
                <input type="hidden" name="tab" value="tabid2"/>
                <input type="submit" value="OK"/>
              </form>
          </body>
        </html>`);
      return next();
    } else {
      var workbook = XLSX.readFile(file.destination + file.filename);
      var sheet_name_list = workbook.SheetNames;
      var xlData = XLSX.utils.sheet_to_csv(workbook.Sheets[sheet_name_list[0]]);

      // Reading line by line
      const allLines = xlData.split(/\r\n|\n/);
      let classCode = "";
      let semesterCode = "";
      let skipClassAndSemester = false;
      allLines.forEach((line) => {
        allCells = line.split(",");
        // skip empty line
        if (allCells[0] == "" && allCells[1] == "") return;

        // parsing class, semester
        allCells.forEach((cell) => {
          // if (!semesterCode && cell.includes("H???c ph???n:")) {
          //   tmp = cell.split(":");
          //   semesterCode = tmp[1].replace('"', "").replace(/\s/g, "");
          //   console.log("H???c ph???n: " + semesterCode);
          //   return;
          // }
          if (!classCode && cell.includes("kho??:")) {
            tmp = cell.split(":");
            classCode = tmp[1].replace('"', "").replace(/\s/g, "");
            console.log("L???p-kho??: " + classCode);
            return;
          }
        });

        if (!skipClassAndSemester && classCode /*&& semesterCode*/) {
          skipClassAndSemester = true;
          connection.query(
            "INSERT INTO `classes` (`classCode`) VALUES (?)",
            [classCode],
            function (error, results, fields) {
              // If there is an issue with the query, output the error
              if (error) {
                if (error.code === "ER_DUP_ENTRY") {
                  console.log("L???p ???? t???n t???i trong DB.");
                } else {
                  res.statusCode = 400;
                  res.end(error);
                }
              }
              // If success
              console.log("???? th??m l???p " + classCode + " v??o DB.");
            }
          );
          // connection.query(
          //   "INSERT INTO `semesters` (`classCode`, `semesterCode`) VALUES (?, ?)",
          //   [classCode, semesterCode],
          //   function (error, results, fields) {
          //     // If there is an issue with the query, output the error
          //     if (error) {
          //       if (error.code === "ER_DUP_ENTRY") {
          //         console.log("H???c ph???n ???? t???n t???i trong DB.");
          //       } else {
          //         res.statusCode = 400;
          //         res.end(error);
          //       }
          //     }
          //     // If success
          //     console.log("???? th??m h???c ph???n " + semesterCode + " v??o DB.");
          //   }
          // );
        }

        // parsing students
        if (isNumeric(allCells[0])) {
          // console.log(line);
          tmp = line.split(",");
          stdCode = tmp[2];
          stdLMName = tmp[3];
          stdFName = tmp[4];
          connection.query(
            "INSERT INTO `students` \
              (`classCode`, `stdCode`, `stdFName`, `stdLMName`) \
              VALUES(?, ?, ?, ?)",
            [classCode, stdCode, stdFName, stdLMName],
            function (error, results, fields) {
              // If there is an issue with the query, output the error
              if (error) {
                if (error.code === "ER_DUP_ENTRY") {
                  // console.log("SV ???? t???n t???i trong DB.");
                  return;
                } else throw error;
              }
              // If success
              if (results.affectedRows > 0) {
                // console.log(
                //   "???? th??m SV " + stdLMName + " " + stdFName + " v??o DB."
                // );
              } else {
                res.statusCode = 500;
                res.end(results);
              }
            }
          );
          return;
        }
      });
    }
    res.statusCode = 200;
    res.end(`
    <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body>
        Th??m l???p th??nh c??ng. <br/>
        <form action="/setting">
          <input type="hidden" name="tab" value="tabid2" />
          <input type="submit" value="OK"/>
        </form>
      </body>
    </html>`);
  }
);

// upload_attachment
app.post(
  "/api/upload_attachment",
  upload.single("attFile"),
  function (req, res, next) {
    if (!req.session.loggedin) {
      res.statusCode = 400;
      res.end("Login first!");
      return;
    }
    const file = req.file;
    if (!file) {
      res.statusCode = 400;
      res.end(`H??y ch???n file`);
      return next();
    } else {
    }
    res.statusCode = 200;
    res.end(`
    <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body>
        Dinh kem th??nh c??ng. <br/>
        <form action="/setting">
          <input type="hidden" name="tab" value="tabid2" />
          <input type="submit" value="OK"/>
        </form>
      </body>
    </html>`);
  }
);

// get_classes
app.post("/api/get_classes", function (req, res) {
  if (!req.session.loggedin) {
    res.statusCode = 400;
    res.end("Login first!");
    return;
  }
  const data = req.body;
  console.log("%s: %j", req.path, data);
  connection.query(
    "SELECT * FROM `classes`",
    function (error, results, fields) {
      // If there is an issue with the query, output the error
      if (error) {
        console.log(error);
        throw error;
      }
      // If success
      res.statusCode = 200;
      res.send(results);
    }
  );
});

// get_semesters
app.post("/api/get_semesters", function (req, res) {
  if (!req.session.loggedin) {
    res.statusCode = 400;
    res.end("Login first!");
    return;
  }
  const data = req.body;
  console.log("%s: %j", req.path, data);
  connection.query(
    "SELECT * FROM `semesters` WHERE classCode = ?",
    [data.classCode],
    function (error, results, fields) {
      // If there is an issue with the query, output the error
      if (error) {
        console.log(error);
        throw error;
      }
      // If success
      res.statusCode = 200;
      res.send(results);
    }
  );
});

// get_students
app.post("/api/get_students", function (req, res) {
  if (!req.session.loggedin) {
    res.statusCode = 400;
    res.end("Login first!");
    return;
  }
  const data = req.body;
  console.log("%s: %j", req.path, data);
  connection.query(
    "SELECT * FROM `students` WHERE classCode = ?",
    [data.classCode],
    function (error, results, fields) {
      // If there is an issue with the query, output the error
      if (error) {
        console.log(error);
        throw error;
      }
      // If success
      res.statusCode = 200;
      res.send(results);
    }
  );
});

// get_accounts
app.post("/api/get_accounts", function (req, res) {
  if (!req.session.loggedin) {
    res.statusCode = 400;
    res.end("Login first!");
    return;
  }
  const data = req.body;
  console.log("%s: %j", req.path, data);
  connection.query(
    "SELECT * FROM `accounts` WHERE username != 'admin'",
    function (error, results, fields) {
      // If there is an issue with the query, output the error
      if (error) {
        console.log(error);
        throw error;
      }
      // If success
      res.statusCode = 200;
      res.send(results);
    }
  );
});

// assign_job
app.post("/api/assign_job", function (req, res) {
  if (!req.session.loggedin) {
    res.statusCode = 400;
    res.end("Login first!");
    return;
  }
  const data = req.body;
  console.log("%s: %j", req.path, data);
  connection.query(
    "INSERT INTO job_assignments (`classCode`, `username`, `jobType`, `assignFrom`, `assignTo`) VALUES(?, ?, ?, ?, ?)",
    [
      data.classCode,
      data.username,
      data.jobType,
      data.assignFrom,
      data.assignTo,
    ],
    function (error, results, fields) {
      // If there is an issue with the query, output the error
      if (error) {
        console.log(error);
        throw error;
      }
      // If success
      // console.log(results);
    }
  );
  res.statusCode = 200;
  res.end(`
    <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body>
        Ph??n c??ng th??nh c??ng. <br/>
        <form action="/setting">
          <input type="hidden" name="tab" value="tabid3"/>
          <input type="submit" value="OK"/>
        </form>
      </body>
    </html>`);
});

// get_job
app.post("/api/get_job", function (req, res) {
  if (!req.session.loggedin) {
    res.statusCode = 400;
    res.end("Login first!");
    return;
  }
  const data = req.body;
  console.log("%s: %j", req.path, data);
  connection.query(
    "SELECT classCode, username, jobType, \
        DATE_FORMAT(assignFrom, '%Y-%m-%d') as assignFrom, \
        DATE_FORMAT(assignTo, '%Y-%m-%d') as assignTo \
     FROM job_assignments WHERE classCode = ? AND username = ?",
    [data.classCode, data.username],
    function (error, results, fields) {
      // If there is an issue with the query, output the error
      if (error) {
        console.log(error);
        throw error;
      }
      // If success
      // console.log(results);
      res.statusCode = 200;
      res.send(results);
    }
  );
});

// get_alljob
app.post("/api/get_alljob", function (req, res) {
  if (!req.session.loggedin) {
    res.statusCode = 400;
    res.end("Login first!");
    return;
  }
  const data = req.body;
  console.log("%s: %j", req.path, data);
  connection.query(
    "SELECT \
        jobType, \
        DATE_FORMAT(assignFrom, '%Y-%m-%d') as assignFrom, \
        DATE_FORMAT(assignTo, '%Y-%m-%d') as assignTo \
     FROM job_assignments WHERE username = ?",
    [data.username],
    function (error, results, fields) {
      // If there is an issue with the query, output the error
      if (error) {
        console.log(error);
        throw error;
      }
      // If success
      // console.log(results);
      res.statusCode = 200;
      res.send(results);
    }
  );
});

// get_violation_detail
app.post("/api/get_violation_detail", function (req, res) {
  if (!req.session.loggedin) {
    res.statusCode = 400;
    res.end("Login first!");
    return;
  }
  const data = req.body;
  console.log("%s: %j", req.path, data);
  connection.query(
    "SELECT * FROM `violation_detail` WHERE job = ?",
    [data.job],
    function (error, results, fields) {
      // If there is an issue with the query, output the error
      if (error) {
        console.log(error);
        throw error;
      }
      // If success
      // console.log(results);
      res.statusCode = 200;
      res.send(results);
    }
  );
});

// add_violation_detail
app.post("/api/add_violation_detail", function (req, res) {
  if (!req.session.loggedin) {
    res.statusCode = 400;
    res.end("Login first!");
    return;
  }
  const data = req.body;
  console.log("%s: %j", req.path, data);
  connection.query(
    "INSERT INTO `violation_detail` (`job`, `detail`) VALUES(?, ?)",
    [data.job, data.detail],
    function (error, results, fields) {
      // If there is an issue with the query, output the error
      if (error) {
        console.log(error);
        throw error;
      }
      // If success
      // console.log(results);
    }
  );
  res.statusCode = 200;
  res.end(`
    <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body>
        Th??m th??nh c??ng. <br/>
        <form action="/setting">
          <input type="hidden" name="tab" value="tabid4"/>
          <input type="submit" value="OK"/>
        </form>
      </body>
    </html>`);
});

// add_department
app.post("/api/add_department", function (req, res) {
  if (!req.session.loggedin) {
    res.statusCode = 400;
    res.end("Login first!");
    return;
  }
  const data = req.body;
  console.log("%s: %j", req.path, data);
  connection.query(
    "INSERT INTO `department` (`name`) VALUES (?);",
    [data.department],
    function (error, results, fields) {
      // If there is an issue with the query, output the error
      if (error) {
        console.log(error);
        throw error;
      }
      // If success
      // console.log(results);
    }
  );
  res.statusCode = 200;
  res.end(`
    <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body>
        Th??m th??nh c??ng. <br/>
        <form action="/setting">
          <input type="hidden" name="tab" value="tabid5"/>
          <input type="submit" value="OK"/>
        </form>
      </body>
    </html>`);
});

// get_department
app.post("/api/get_department", function (req, res) {
  if (!req.session.loggedin) {
    res.statusCode = 400;
    res.end("Login first!");
    return;
  }
  const data = req.body;
  console.log("%s: %j", req.path, data);
  connection.query(
    "SELECT * FROM `department`",
    function (error, results, fields) {
      // If there is an issue with the query, output the error
      if (error) {
        console.log(error);
        throw error;
      }
      // If success
      // console.log(results);
      res.statusCode = 200;
      res.send(results);
    }
  );
});

// get_violation_records
app.post("/api/get_violation_records", function (req, res) {
  if (!req.session.loggedin) {
    res.statusCode = 400;
    res.end("Login first!");
    return;
  }
  const data = req.body;
  console.log("%s: %j", req.path, data);
  connection.query(
    "SELECT *,\
        DATE_FORMAT (violation_records.createdDate, '%d/%m/%Y') as createdDate \
      FROM violation_detail \
      INNER JOIN violation_records \
      ON violation_records.detailid = violation_detail.detailid \
      WHERE ( \
        violation_records.classCode = ? \
        AND violation_records.job = ? \
        )",
    [data.classCode, data.job],
    function (error, results, fields) {
      // If there is an issue with the query, output the error
      if (error) {
        console.log(error);
        throw error;
      }
      // If success
      // console.log(results);
      res.statusCode = 200;
      res.send(results);
    }
  );
});

// add_violation_records
app.post("/api/add_violation_records", function (req, res) {
  if (!req.session.loggedin) {
    res.statusCode = 400;
    res.end("Login first!");
    return;
  }
  const data = req.body;
  console.log("%s: %j", req.path, data);
  detailArr = JSON.parse(data.detailArr);
  if (!detailArr.length) {
    res.statusCode = 400;
    res.end("Ch??a c?? d??? li???u vi ph???m");
    return;
  }

  let query =
    "INSERT INTO `violation_records` \
    (`classCode`, `semesterCode`, `job`, `detailId`, `detailInfo`, `preventionInfo`, `createdBy`, `createdDate`) \
    VALUES ";
  for (i = 0; i < detailArr.length; ++i) {
    query += `('${data.classCode}', 
        '${data.semesterCode}', 
        '${data.job}', 
        '${data.detailId}',
        '${detailArr[i].detailInfo}',
        '${preventionArr[i].preventionInfo}',
        '${req.session.username}',
        '${data.date}')`;
    if (i + 1 == detailArr.length) query += "";
    else query += ",";
  }
  console.log(query);
  connection.query(query, function (error, results, fields) {
    // If there is an issue with the query, output the error
    if (error) {
      console.log(error);
      throw error;
    }
    // If success
    // console.log(results);
  });
  res.statusCode = 200;
  res.end();
});

// update_violation_record
app.post("/api/update_violation_record", function (req, res) {
  if (!req.session.loggedin) {
    res.statusCode = 400;
    res.end("Login first!");
    return;
  }
  const data = req.body;
  console.log("%s: %j", req.path, data);
  connection.query(
    "UPDATE `violation_records` SET detailInfo = ?, preventionInfo = ? WHERE id = ?",
    [data.detailInfo, data.preventionInfo, data.id],
    function (error, results, fields) {
      // If there is an issue with the query, output the error
      if (error) {
        console.log(error);
        throw error;
      }
      // If success
      // console.log(results);
    }
  );
  res.statusCode = 200;
  res.end();
});

// delete_violation_record
app.post("/api/delete_violation_record", function (req, res) {
  if (!req.session.loggedin) {
    res.statusCode = 400;
    res.end("Login first!");
    return;
  }
  const data = req.body;
  console.log("%s: %j", req.path, data);
  connection.query(
    "DELETE FROM `violation_records` WHERE `id` = ?",
    [parseInt(data.id)],
    function (error, results, fields) {
      // If there is an issue with the query, output the error
      if (error) {
        console.log(error);
        throw error;
      }
      // If success
      // console.log(results);
    }
  );
  res.statusCode = 200;
  res.end();
});

// statistic
app.post("/api/statistic", function (req, res) {
  if (!req.session.loggedin) {
    res.statusCode = 400;
    res.end("Login first!");
    return;
  }

  const data = req.body;
  console.log("%s: %j", req.path, data);

  let query = `
    SELECT 
      ROW_NUMBER() OVER() as 'STT',
      classCode as 'L???p',
      semesterCode as 'H???c Ph???n',
      department.name as '????n v???',
      job_desc as 'Qu?? tr??nh',
      detail as 'Danh m???c vi ph???m',
      detailInfo as 'N???i dung vi ph???m',
      preventionInfo as 'Bi???n ph??p ph??ng tr??nh',
      createdBy as 'Ng?????i nh???p',
      DATE_FORMAT(createdDate, '%d/%m/%Y') as 'Ng??y nh???p'
    FROM violation_records
    INNER JOIN violation_detail 
    ON violation_records.detailid = violation_detail.detailid
    INNER JOIN job_desc
    ON violation_records.job = job_desc.job_id
    INNER JOIN department
    ON violation_records.departmentId = department.id
    WHERE 1 = 1 `;
  let filterDate = "Th???i gian: ";
  let filterClass = "L???p: ";
  let filterDept = "????n v???: ";
  let filterJob = "Qu?? tr??nh: ";
  let filterUser = "Ng?????i nh???p: ";
  if (data.fromDate && data.toDate) {
    query += `AND violation_records.createdDate BETWEEN ${data.fromDate} AND ${data.toDate} `;
    filterDate += `${data.fromDate} ?????n ${data.toDate} `;
  }
  if (data.classCode) {
    query += `AND classCode = '${data.classCode}' `;
    filterClass += `${data.classCode}`;
  }
  if (data.departmentId) {
    query += `AND department.id = '${data.departmentId.split(".")[0]}' `;
    filterDept += `${data.departmentId.split(".")[1]}`;
  }
  if (data.jobId) {
    query += `AND violation_records.job = '${data.jobId.split(".")[0]}' `;
    filterJob += `${data.jobId.split(".")[1]}`;
  }
  if (data.createdBy) {
    query += `AND createdBy = '${data.createdBy}' `;
    filterUser += `${data.createdBy}`;
  }

  connection.query(query, function (error, results, fields) {
    // If there is an issue with the query, output the error
    if (error) {
      console.log(error);
      throw error;
    }
    // If success

    let ws = XLSX.utils.json_to_sheet(results, {
      paperSize: 9,
      orientation: "landscape",
      origin: "A9",
    });
    var wscols = [
      { wch: 5 },
      { wch: 10 },
      { wch: 10 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 10 },
      { wch: 10 },
    ];
    ws["!cols"] = wscols;

    const date = new Date();
    dateStr = `Ng??y t???o: ${date.getDate()}/${
      date.getMonth() + 1
    }/${date.getFullYear()} ${date.getHours()}:${
      date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()
    }`;

    XLSX.utils.sheet_add_aoa(
      ws,
      [["B??O C??O TH???NG K?? PH???N M???M KI???M TRA GI??M S??T"]],
      { origin: "A1" }
    );
    XLSX.utils.sheet_add_aoa(ws, [[dateStr]], { origin: "A2" });
    XLSX.utils.sheet_add_aoa(ws, [["B??? l???c: "]], { origin: "A3" });
    XLSX.utils.sheet_add_aoa(ws, [[filterDate]], { origin: "B3" });
    XLSX.utils.sheet_add_aoa(ws, [[filterClass]], { origin: "B4" });
    XLSX.utils.sheet_add_aoa(ws, [[filterDept]], { origin: "B5" });
    XLSX.utils.sheet_add_aoa(ws, [[filterJob]], { origin: "B6" });
    XLSX.utils.sheet_add_aoa(ws, [[filterUser]], { origin: "B7" });

    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Th???ng k??");
    XLSX.writeFile(wb, __dirname + "/uploads/Bao-cao-vi-pham.xlsx");

    res.statusCode = 200;
    res.download(__dirname + "/uploads/Bao-cao-vi-pham.xlsx");
  });
});
