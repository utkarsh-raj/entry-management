'use strict'
// Import modules

var express = require("express"),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    request = require("request"),
    timeout = require("connect-timeout"), 
    nodemailer = require('nodemailer'),
    http = require("https");

// Application setup

var app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(timeout("60s"));
app.use(express.static("public"));
var transporter = nodemailer.createTransport({
 service: 'gmail',
 auth: {
        user: 'entry.manage.testing@gmail.com',
        pass: "<password>"
    }
});
mongoose.connect("mongodb+srv://<username>:<password>@cluster0-0cl3l.mongodb.net/test?retryWrites=true&w=majority", { useNewUrlParser: true , useUnifiedTopology: true});


var number_of_visitors = 0;
var hostLoggedIn = false;
var host_id = null;
var host_email = null;
var service_email = "entry.manage.testing@gmail.com";

// Models

var hostSchema = new mongoose.Schema({
    name: {type:String},
    email: {type: String},
    phone: {type: Number},
    address: {type: String, default: "Not Specified"}
});

var date = new Date();

var guestSchema = new mongoose.Schema({
    name: {type: String},
    email : {type: String},
    phone: {type: Number},
    entry_time: {type: String, default: date.toString()},
    checkout_time: {type: String, default: ""}
});

var Host = mongoose.model("Host", hostSchema);
var Guest = mongoose.model("Guest", guestSchema);

// Host.deleteOne({ name: 'Utkarsh' } ); 
// Host.find({},function(err, hosts) {
// 	console.log(hosts);
// });

// Guest.deleteMany({ });

// Routes

app.get("/", function(req, res) {
	if (hostLoggedIn === false) {
		res.render("host_login");
	}
	res.render("visitor_login");
});

app.post("/host_login", function(req, res) {
	var name = req.body.name;
	var email = req.body.email;
	var phone = req.body.phone;
	var address = req.body.address;
	console.log(name, email, phone, address);

	Host.find({
		name: name,
		email: email,
		phone: phone,
		address: address
	}, function(err, host) {
		if (err) {
			console.log(err);
		} else {
			if (host.length !== 0) {
				hostLoggedIn = true;
				host_email = host.email;

				console.log(host);

				res.redirect(302, "/index/" + host[0]._id);
			}
			else {
				Host.create({
					name: name,
					email: email,
					phone: phone,
					address: address
				}, function(err, host) {
					if (err) {
						console.log(err);
					}
					else {
						hostLoggedIn = true;
						host_email = host.email ; 

						res.redirect(302, "/index/" + host._id);
					}
				});
			}
		}
	});
});

app.post("/visitor_login", function(req, res) {
	if (hostLoggedIn === false) {
		res.redirect(302, "host_login");
	}
	var name = req.body.name;
	var email = req.body.email;
	var phone = req.body.phone;

	console.log(name, email, phone);

	Guest.find({
		name: name,
		email: email,
		phone: phone,
		checkout_time: ""
	}, function(err, guest) {
		if (err) {
			console.log(err);
		} else {
			if (guest.length !== 0) {
				number_of_visitors++;

				console.log(guest);

				Host.find({}, function(err, host){
					if (err) {
						console.log(err);
					}
					else {
						var host_email = host[0].email;
							transporter.sendMail({
							from: service_email,
							to: String(host_email),
							subject: guest.name + " has arrived",
							html: '<p>' + guest.name + ' has arrived at the facility at ' + guest.entry_time + '</p>'
					}, function (err, info) {
					   if(err)
					     console.log(err)
					   else
					     console.log(info);
					});
					
					var message_path = "/api/sendhttp.php?route=4&sender=TESTIN&mobiles=" + String(host[0].phone)+"&message=" + encodeURI(guest.name + "has arrived at the facility.") + encodeURI(guest[0].name)+ "&country=91&authkey=<Messaging API Key here.>";
					var options = {
						  "method": "GET",
						  "hostname": "api.msg91.com",
						  "port": null,
						  "path": message_path,
						  "headers": {}
						};

					var req = http.request(options, function (res) {
					  var chunks = [];

					  res.on("data", function (chunk) {
					    chunks.push(chunk);
					  });

					  res.on("end", function () {
					    var body = Buffer.concat(chunks);
					    console.log(body.toString());
					  });
					});

					req.end();
					}

					res.render("leave_events", {number_of_visitors: number_of_visitors, user_id: guest[0]._id, host_id: host[0]._id});
				});

				


				
			}
			else {
				Guest.create({
					name: name,
					email: email,
					phone: phone,
				}, function(err, guest) {
					if (err) {
						console.log(err);
					}
					else {
						number_of_visitors++;



						Host.find({}, function(err, host){
							if (err) {
								console.log(err);
							}
							else {
								var host_email = host[0].email;
									transporter.sendMail({
									from: service_email,
									to: String(host_email),
									subject: guest.name + " has arrived",
									html: '<p>' + guest.name + ' has arrived at the facility at ' + guest.entry_time + '</p>'
							}, function (err, info) {
							   if(err)
							     console.log(err)
							   else
							     console.log(info);
							});
							var message_path = "/api/sendhttp.php?route=4&sender=TESTIN&mobiles=" + encodeURI(host.phone)+"&message=" + encodeURI(guest.name + "has arrived at the facility.") + encodeURI(guest.name)+ "&country=91&authkey=<Messaging API Key here.>";
							var options = {
								  "method": "GET",
								  "hostname": "api.msg91.com",
								  "port": null,
								  "path": message_path,
								  "headers": {}
								};

							var req = http.request(options, function (res) {
							  var chunks = [];

							  res.on("data", function (chunk) {
							    chunks.push(chunk);
							  });

							  res.on("end", function () {
							    var body = Buffer.concat(chunks);
							    console.log(body.toString());
							  });
							});

							req.end();
							}

							res.render("leave_events", {number_of_visitors: number_of_visitors, user_id: guest._id, host_id: host[0]._id});
						});



						
					}
				});
			}
		}
	});
});

app.get("/leave_events/:visitor_id/:host_id", function(req, res) { 
	var visitor_id = req.params.visitor_id;
	var host_id=req.params.host_id;
	Guest.findByIdAndUpdate({_id:visitor_id}, {$set:{checkout_time: date.toString()}}, function(err, visit) {
		if (err) {
			console.log(err);
		}
		else {
			Host.find({_id: host_id}, function(err, host) {
				if (err) {
					console.log(err);
				}
				else {

					var html = '<p> Hello ' + visit.name + ', hope you had a great time. Here are the details of your visit: <br> <ul><li>Name: ' + visit.name + '</li><li>Phone (Host): ' + host[0].phone + '</li><li>Check-in time: ' + visit.entry_time + '</li><li>Check-out time: ' + date.toString() + '</li><li>Host Name: ' + host[0].name + '</li><li>Address visited: ' + host[0].address + '</li></ul></p>';
					console.log(visit);
					number_of_visitors--;

					transporter.sendMail({
							from: service_email,
							to: String(visit.email),
							subject: "See you again!",
							html: html
					}, function (err, info) {
					   if(err)
					     console.log(err)
					   else
					     console.log(info);
					});
					var options = {
								  "method": "GET",
								  "hostname": "api.msg91.com",
								  "port": null,
								  "path": "/api/sendhttp.php?route=4&sender=TESTIN&mobiles=" + encodeURI(visit.phone)+"&message=" + encodeURI("Thank you for your visit. -" + host[0].name) + encodeURI(visit.name)+ "&country=91&authkey=<Messaging API Key here.>",
								  "headers": {}
								};

							var req = http.request(options, function (res) {
							  var chunks = [];

							  res.on("data", function (chunk) {
							    chunks.push(chunk);
							  });

							  res.on("end", function () {
							    var body = Buffer.concat(chunks);
							    console.log(body.toString());
							  });
							});

							req.end();
					res.redirect(302, "/");
				}
			})
		}
	});
});

app.get("/leave_events_host/:host_id", function(req, res) {
	var host_id = req.params.host_id;
	Host.findByIdAndRemove(host_id, function(err, host) { 
		if (err) {
			console.log(err);
		}
		else {


			hostLoggedIn = false;
			res.redirect(302, "/");
		}
	});
});

app.get("/index/:host_id", function(req, res) {
	var host_id = req.params.host_id;
	Guest.find({}).sort('-entry_time').exec(function(err, guests) {
		if (err) {
			console.log(err);
		}
		else {
			console.log(guests);
			res.render("host_index", {guests: guests, host_id: host_id});
		}
	});
});

// End of Routes

var port = process.env.PORT || 8000;

app.listen(port, process.env.IP, function(req, res) {
	console.log("The Entry Management App has started!");
});