const express = require('express')
const cors = require('cors')
const isReachable = require('is-reachable');
const http = require('http');
const mysql = require('mysql2')
const dotenv = require('dotenv')
const cron = require('node-cron');
const LineAPI = require('line-api');
const path = require('path');
const notify = new LineAPI.Notify({
    token: ""
})

dotenv.config()

// Database Connection
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
})

// const api_connection = mysql.createConnection({
//     host: process.env.DB_HOST_API,
//     user: process.env.DB_USER_API,
//     password: process.env.DB_PASSWORD_API,
//     database: process.env.DB_NAME_API,
//     port: process.env.DB_PORT_API
// })


const app = express()
app.use(cors())
app.use(express.json())

app.listen(3000, function () {
    console.log('<< CHIMS - API Data Transfer >>')
})

// Cron Data API
// cron.schedule('00 10 * * *', function () {
//     let d = new Date(Date.now()).toLocaleString(); //แสดงวันที่และเวลา
//     console.log("------------------------------------------");
//     console.log(`Running Cron Job ${d}`);;
    
//     // Run Script
//     var options = {
//         host: process.env.DB_HOST_API,
//         port: process.env.H_PORT,
//         path: '/get_api',
//         method: 'GET'
//     };
    
//     http.request(options, function(res) {
//         console.log('\nRunning API Script :: ' + options.path)
//     }).end();
//     // End 

//     isReachable(process.env.DB_HOST_API +":"+ process.env.H_PORT).then(reachable => {
//         if (!reachable) { // => false
//             let msg = `API Error !!\n` + d + ` :: ` + h_code + ` => ` + h_name
//             notify.send({
//                 message: msg
//             })
//         }else{
//             let msg = `Transfer Data Success !!\n` + d + ` :: ` + h_code + ` => ` + h_name;
//             notify.send({
//                 message: msg
//             })
//         }
//     })
// });

// Send Data API
app.get('/get_data', async (req, res) => {
    try {
        connection.query('SELECT vn,hcode,hn,an,pid,er_call,emergency,opdipd,date_rx,time_in,date_rec,time_rec,icd9,icd10,' +
            'icd10_n,fund,refer,reporter,h_login,p_year,p_month,hospmain,drug,lab,proc,service_charge,with_ambulance,pttype,`name`' + 
            'FROM api_claim_hos',
            (err, result, field) => {
                if (err) {
                    console.log(err)
                    return res.status(400).send()
                }
            // res.status(200).json(result)
                var jsArray = result;
                var keyCount  = Object.keys(result).length;
                jsArray.forEach(jsData =>
                    connection.query('INSERT INTO claim_list ' + 
                    '(vn,hcode,hn,an,pid,er_call,emergency,opdipd,date_rx,time_in,date_rec,time_rec,icd9,icd10,' + 
                    'icd10_n,fund,refer,reporter,h_login,p_year,p_month,hospmain,drug,lab,proc,service_charge,with_ambulance,pttype,ptname)' + 
                    ' VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                    [
                        jsData.vn,jsData.hcode,jsData.hn,jsData.an,jsData.pid,jsData.er_call,
                        jsData.emergency,jsData.ipdopd,jsData.date_rx,jsData.time_in,jsData.date_rec,
                        jsData.time_rec,jsData.icd9,jsData.icd10,jsData.icd10_n,jsData.fund,jsData.refer,
                        jsData.reporter,jsData.h_login,jsData.p_year,jsData.p_month,jsData.hospmain,
                        jsData.drug,jsData.lab,jsData.proc,jsData.service_charge,jsData.with_ambulance,jsData.pttype,jsData.name,
                    ],
                     (err, results) => {
                        if (err) throw err
                    })
                );
                var ProgressBar = require('progress');
                count = 20 / keyCount;
                var bar = new ProgressBar('Processing [ :percent ]', { total: keyCount });
                var timer = setInterval(function () {
                bar.tick();
                if (bar.complete) {
                    console.log("API Data Transfer Complete :: "+ keyCount + " Records " + 
                    "\n------------------------------------------\n");
                    clearInterval(timer);
                }
            }, count);
            res.status(200).json("Total Data :: "+ keyCount + " Records")
            })
    } catch (err) {
        console.log(err)
        return res.status(500).send()
    }
})
