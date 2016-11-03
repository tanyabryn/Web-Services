const express = require("express");
const entities = require("./entities");
const bodyParser = require('body-parser')
const uuid = require("node-uuid");
const elasticsearch = require('elasticsearch');
const app = express();

const CONTENT_TYPE = 'application/json';
const ADMIN_TOKEN = "smuuu";
const client = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'error'
});

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

//  This method returns a list of all users that are registered
//  Returns status code 200, If something went wrong while fetching
//  the data to the database then status code 500 is returned.
//  GET /api/users
app.get("/users", (req, res) => {

    entities.User.find(function (err, docs) {
        if (err) {
            res.status(500).send("Something went wrong while fetching the data");
        } else {
            res.json(docs);
        }
    });
});

//  This method returns a list of all companies that are registered
//  Returns status code 200
//  If something went wrong while fetching
//  the data to the database then status code 500 is returned.
//  GET /api/companies
app.get("/companies", (req, res) => {

    entities.Company.find(function (err, docs) {
        if (err) {
            res.status(500).send("Something went wrong while fetching the data");
        } else {
            res.json(docs);
        }
    });
});

//  This method returns a company with the requested id and status code 200.
//  If there is no company with the requested id then status code 404 is returned.
//  If something went wrong while fetching
//  the data to the database then status code 500 is returned.
//  GET api/companies/:id
app.get("/companies/:id", (req, res) => {

    var query = {
        _id: req.params.id
    };

    entities.Company.find(query, function (err, doc) {
        if (err) {
            res.status(404).send();
        }
        else if (doc.length !== 1) {
            res.status(500).send("Something went wrong while fetching the data")
        }
        else {
            res.json(doc);
        }
    })
});

//  This method adds a new company and returns status code 201. If required properties
//  are missing or if they are in incorrect form then status code 412 is returned.
//  if admin token is missing or is incorrect then status code 401 is returned.
//  POST /api/companies
app.post("/companies", (req, res) => {
    if (req.headers.authorization !== adminToken) {
        res.status(401).send("Not authorized");
        return;
    }
    const requestType = req.get['content-type'];

    if(req.get('Content-Type') !== CONTENT_TYPE) {
        res.status(415).send("Unsupported Media Type");
        return;
    }

    var newCompany = req.body;

    var data = {
        name: newCompany.name,
        punchCount: newCompany.punchCount
    }
    var description = {
        description: newCompany.description
    }

    var entity = new entities.Company(data);

    entity.save(function (err) {
        if (err) {
            res.status(412).send("Payload is not valid");
            return;
        } else {
            client.index({
                index: 'companies',
                type: 'company',
                id: entity._id,
                body: {
                    doc: {
                        name: data.name,
                        punchCount: data.punchCount,
                        description: description.description
                    }
                }
            }), function (err) {
                if (err) {
                    res.status(500).send(err.message);
                } else {
                    res.status(201).send({
                        _id: entity._id
                    });
                }
            }
        }
    });
});

//  This method adds a new user and returns status code 201. If required properties
//  are missing or if they are in incorrect form then status code 412 is returned.
//  if admin token is missing or is incorrect then status code 401 is returned.
//  POST /api/users
app.post("/users", (req, res) => {
    if (req.headers.authorization !== adminToken) {
        res.status(401).send("Not authorized");
        return;
    }
    var data = {
        name: req.body.name,
        token: uuid.v1(),
        gender: req.body.gender
    }

    var entity = new entities.User(data);

    entity.save(function (err) {
        if (err) {
            res.status(412).send("Payload is not valid");
            return;
        } else {
            res.status(201).send({
                _id: entity._id,
                token: entity.token
            });
        }
    });
});

//  This method adds add a new punch to the user account for the requested company
//  and returns status code 201 and the id for the newly created punch. 
//  If no user is found by the token or token value is missing then status code 401 is 
//  returned. If more than one user is found by the token then status code 500 is returned
//  If no company is found by the given id then status code 404 is returned. If more than one
//  user is found by the id then status code 500 is returned.

//  POST /api/users/:id/punches
app.post("/my/punches", (req, res) => {
    const token = req.headers.authorization;

    var queryUser = {
        token: token
    };

    var queryCompany = {
        _id: req.body._id
    };

    entities.Com
    entities.User.find(queryUser, function (err, docUser) {
        if (err) {
            res.status(401).send();
            return;
        }
        else if(docUser.length === 0){
            res.status(401).send();
            return;
        }
        else if (docUser.length !== 1) {
            res.status(500).send();
            return;
        }
        else {
            entities.Company.find(queryCompany, function (err, docCompany) {
                if (err) {
                    res.status(401).send();
                    return;
                }
                else if(docCompany.length === 0){
                    res.status(404).send();
                    return;
                }
                else if (docCompany.length !== 1) {
                    res.status(500).send();
                    return;
                }
                else {
                    var data = {
                        company_id: docCompany[0]._id,
                        user_id: docUser[0]._id
                    };

                    var punches = docCompany[0].punchCount;

                    queryPunches = {
                        user_id: data.user_id,
                        company_id: data.company_id,
                        used: false
                    };

                    entities.Punch.find(queryPunches, function (err, docPunch) {
                        // Checks if user has enough punches for discount
                        // if he does then used is changed to true.
                        if (docPunch.length >= punches) {
                            entities.Punch.update(queryPunches, { $set: { used: true } }, { multi: true }, function (err, docs) {
                                if (err) {
                                    res.status(500).send("Could not update data");
                                    return;
                                }
                            });
                            var discount = {
                                discount: true
                            };
                            return res.json(discount);
                        }
                        else {
                            var entity = new entities.Punch(data);

                            entity.save(function (err) {
                                if (err) {
                                    res.status(412).send();
                                    return;
                                } else {
                                    res.status(201).send({
                                        _id: entity._id,
                                    });
                                    return;
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});

module.exports = app;