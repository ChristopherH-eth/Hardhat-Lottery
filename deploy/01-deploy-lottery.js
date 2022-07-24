/**
 * @param network Detects network via Hardhat Runtime Environment (hre).
 * @param ethers Uses ethers.js through Hardhat.
 * @param developmentChains Detects local blockchains.
 * @param networkConfig Includes network names and VRFCoordinatorV2 contract
 * addresses found in "../helper-hardhat-config.js".
 * @param verify Used to verify Lottery contract when deploying to test or mainnet
 * @param VRF_SUB_FUND_AMOUNT Amount used to fund the subscription through the VRFCoordinatorV2Mock
 */

const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("30")

/**
 * @dev This async function passes getNamedAccounts to get the user accounts, and deployments
 * @dev to use deploy and log functionality from hre (Hardhat Runtime Environment). If a
 * @dev local blockchain is detected via network.name, mocks are deployed; otherwise, the
 * @dev function proceeds directly to Lottery smart contract deployment.
 * @param deploy Using deploy from hre to deploy mocks.
 * @param log Using log to simplify logging.
 * @param deployer Using deployer account for deploying mocks.
 * @param chainId Grabs corresponding network chainId from "../helper-hardhat-config.js".
 * @param vrfCoordinatorV2Address Takes the contract address of either the deployed mock
 * or the contract address on the corresponding network.
 * @param subscriptionId The subscription ID emitted from the VRFCoordinatorV2Mock when
 * calling createSubscription() since there are no LINK nodes on our local blockchains.
 */

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    let vrfCoordinatorV2Address, subscriptionId

    /**
     * @dev Detects network and deploys mocks if on a local blockchain; else, it grabs the
     * @dev VRFCoordinatorV2 address for the connected network.
     * @param vrfCoordinatorV2Mock Gets contract info for VRFCoordinatorV2Mock.
     * @param transactionResponse Waits for createSubscription function event.
     * @param transactionReceipt Waits 1 block for subscription creation.
     */

    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
        const transactionResponse = await vrfCoordinatorV2Mock.createSubscription()
        const transactionReceipt = await transactionResponse.wait(1)
        subscriptionId = transactionReceipt.events[0].args.subId
        // Fund the subscription
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT)
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"]
        subscriptionId = networkConfig[chainId]["subscriptionId"]
    }

    /**
     * @param entranceFee Contains an entranceFee for the connected network.
     * @param gasLane Key hash for corresponding gwei requirement.
     * @param callBackGasLimit Maximum gas limit for the contract to deploy with.
     * @param interval Interval requirement for checkUpkeep function.
     * @param args Array of correspond args from "helper-hardhat-config" for contract
     * deployment.
     * @param lottery Deploys the Lottery smart contract while passing the
     * following:
     * 1. from: deployer (contract deployer)
     * 2. args: args (passes args constant)
     * 3. log: true (enables logging on deployment)
     * 4. waitConfirmations waits a predetermined number of block confirmations
     * based on the network or 1.
     */

    const entranceFee = networkConfig[chainId]["entranceFee"]
    const gasLane = networkConfig[chainId]["gasLane"]
    const callBackGasLimit = networkConfig[chainId]["callBackGasLimit"]
    const interval = networkConfig[chainId]["interval"]
    const args = [
        vrfCoordinatorV2Address,
        entranceFee,
        gasLane,
        subscriptionId,
        callBackGasLimit,
        interval,
    ]
    const lottery = await deploy("Lottery", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    // Call verify script if not on local blockchain and Etherscan API key is present
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(lottery.address, args)
    }
    log("---------------------------------------------")
}

module.exports.tags = ["all", "lottery"]
