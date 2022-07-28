const { developmentChains } = require("../helper-hardhat-config")

/**
 * @param BASE_FEE 0.25 is the premium; it costs 0.25 LINK per request.
 * @param GAS_PRICE_LINK Calculated value base on the gas price of the chain.
 */

const BASE_FEE = ethers.utils.parseEther("0.25")
const GAS_PRICE_LINK = 1e9

/**
 * @dev This async function passes getNamedAccounts to get the user accounts, and deployments
 * to use deploy and log functionality from hre (Hardhat Runtime Environment). This
 * function detects if the user account is connecting to a local blockchain and if true,
 * deploys the VRFCoordinator mock.
 * @param deploy Using deploy from hre to deploy mocks.
 * @param log Using log to simplify logging.
 * @param deployer Using deployer account for deploying mocks.
 */

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const args = [BASE_FEE, GAS_PRICE_LINK]

    // Detects network and deploys mocks if on a local blockchain.
    if (developmentChains.includes(network.name)) {
        log("Local network detected. Deploying mocks...")
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: args,
        })
        log("Mocks deployed!")
        log("---------------------------------------------")
    }
}

module.exports.tags = ["all", "mocks"]
