const { ethers } = require("hardhat")
const fs = require("fs")

const FRONT_END_ADDRESSES_FILE = "../nextjs-smartcontract-lottery/constants/contractAddresses.json"
const FRONT_END_ABI_FILE = "../nextjs-smartcontract-lottery/constants/abi.json"

/**
 * @dev This function updates contract addresses for each chain the contract is deployed on, as well
 * @dev the abi.
 */

module.exports = async function () {
    if (process.env.UPDATE_FRONT_END) {
        console.log("Updating front end...")
        updateContractAddresses()
        updateABI()
    }
}

/**
 * @param updateABI function updates the front end ABI file upon execution.
 */

async function updateABI() {
    const lottery = await ethers.getContract("Lottery")
    fs.writeFileSync(FRONT_END_ABI_FILE, lottery.interface.format(ethers.utils.FormatTypes.json))
}

/**
 * @param updateContractAddresses function updates the contract address for the corresponding chain
 * when the function is called in the front end Contract Addresses file.
 */

async function updateContractAddresses() {
    const lottery = await ethers.getContract("Lottery")
    const chainId = network.config.chainId.toString()
    const currentAddresses = JSON.parse(fs.readFileSync(FRONT_END_ADDRESSES_FILE, "utf8"))

    if (chainId in currentAddresses) {
        if (!currentAddresses[chainId].includes(lottery.address)) {
            currentAddresses[chainId].push(lottery.address)
        }
    } else {
        currentAddresses[chainId] = [lottery.address]
    }

    fs.writeFileSync(FRONT_END_ADDRESSES_FILE, JSON.stringify(currentAddresses))
}

module.exports.tags = ["all", "frontend"]
