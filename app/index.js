const Vallox = require('@danielbayerlein/vallox-api')
const http = require("http");

if (process.argv.length < 5) {
    console.log("Usage: node start <vallox unit host> <metrics host> <poll interval>")
    process.exit()
}

var host = process.argv[2]
var writeHost = process.argv[3]
var interval = process.argv[4]

console.log("Vallox ventilation unit host: " + host)
console.log("Writing to host: " + writeHost)
console.log("Polling interval: " + interval)

const client = new Vallox({ ip: host, port: 80 })

async function poll() {
    while (true) {
        await new Promise(resolve => setTimeout(resolve, interval * 1000));

        const result = await client.fetchMetrics([
            'A_CYC_TEMP_EXTRACT_AIR',
            'A_CYC_TEMP_EXHAUST_AIR',
            'A_CYC_TEMP_OUTDOOR_AIR',
            'A_CYC_TEMP_SUPPLY_CELL_AIR',
            'A_CYC_TEMP_SUPPLY_AIR',
        ])

        write(result)
    }
}

function write(data) {
    const options = {
        hostname: writeHost,
        port: 8428,
        path: '/write',
        method: 'POST',
        headers: {}
      }
    
    var req = http.request(
        options,
        resp => {
            resp.on("data", d => {
                process.stdout.write(d)
            });
        })
        .on("error", err => {
            console.log("Error: " + err.message)
        }
    )

    var s = `vallox,tag=vallox temp_extract_air=${data.A_CYC_TEMP_EXTRACT_AIR},temp_exhaust_air=${data.A_CYC_TEMP_EXHAUST_AIR},temp_outdoor_air=${data.A_CYC_TEMP_OUTDOOR_AIR},temp_supply_cell_air=${data.A_CYC_TEMP_SUPPLY_CELL_AIR},temp_supply_air=${data.A_CYC_TEMP_SUPPLY_AIR}`

    req.write(s)
    req.end()
}
  
poll()