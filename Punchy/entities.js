const mongoose = require("mongoose");
const mongoosastic = require('mongoosastic');

//  This schema represents users stored in database.
const UsersSchema = new mongoose.Schema({
    //  The name of the user, this field is required.
    //  Example: "Elvis"
    name: {
        type: String,
        required: true
    },
    //  The token that the api generates for the user.
    //  Example: "15c9bd10-9968-11e6-834c-5707578cffe8"
    token: {
        type: String
    },
    //  The gender of the user, this field has to be f, m or o.
    //  Example: "f"
    gender: {
        type: String,
        enum: ['f', 'm', 'o']
    },
}, { versionKey: false });

//  This schema represents companies stored in database.
const CompanySchema = new mongoose.Schema({
    //  The name of the company, this field is required.
    //  Example: "Te og kaffi"
    name: {
        type: String,
        required: true
    },
    //  The number of punches a user needs to obtain in order to be given a discount.
    //  The default value is 10.
    //  Example: 9
    punchCount: {
        type: Number,
        default: 10
    },
}, { versionKey: false });

//  This schema represents punches stored in database.
const PunchSchema = new mongoose.Schema({
    //  The company id for the given punch.
    //  Example: "580d33771cc8c22fcc21b89f"
    company_id: {
        type: mongoose.Schema.Types.ObjectId, ref: 'CompanySchema',
        required: true
    },
    //  The user id for the given punch.
    //  Example: "15c9bd10-9968-11e6-834c-5707578cffe8"
    user_id: {
        type: mongoose.Schema.Types.ObjectId, ref: 'UsersSchema',
        required: true
    },
    //  The date that the punch was created.
    //  Example:Sun Oct 23 2016 22:06:13 GMT+0000 (Greenwich Standard Time) 
    created: {
        type: Date,
        default: new Date()
    },
    //  Indicates if the user has used up the discount after reaching punchCount 
    //  for the company, initial value is false.
    //  Example: true
    used: {
        type: Boolean,
        default: false
    }
}, { versionKey: false });


UsersSchema.plugin(mongoosastic);
PunchSchema.plugin(mongoosastic);
CompanySchema.plugin(mongoosastic);

const UserEntity = mongoose.model("Users", UsersSchema);
const PunchEntity = mongoose.model("Punches", PunchSchema);
const CompanyEntity = mongoose.model("Companies", CompanySchema)


const entities = {
    User: UserEntity,
    Punch: PunchEntity,
    Company: CompanyEntity
};

module.exports = entities;