const { assert, expect } = require("chai")
const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

/**
 * @notice This is the staging test for the Lottery project.
 * @dev Before testing, we get our deployer account and deploy the Lottery contract.
 */

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Lottery Staging Test", function () {
          let lottery, lotteryEntranceFee, deployer
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              lottery = await ethers.getContract("Lottery", deployer)
              lotteryEntranceFee = await lottery.getEntranceFee()
          })

          describe("fulfillRandomWords", function () {
              it("Works with live Chainlink Keepers and Chainlink VRF; we get a random winner", async function () {
                  // Enter the lottery
                  console.log("Setting up test...")
                  const startingTimeStamp = await lottery.getLatestTimeStamp()
                  const accounts = await ethers.getSigners()

                  // Setup listener before we enter the lottery just in case the blockchain moves really fast
                  console.log("Setting up listener...")
                  await new Promise(async (resolve, reject) => {
                      lottery.once("WinnerPicked", async () => {
                          console.log("WinnerPicked event fired!")
                          try {
                              const recentWinner = await lottery.getRecentWinner()
                              const lotteryState = await lottery.getLotteryState()
                              const winnerEndingBalance = await accounts[0].getBalance()
                              const endingTimeStamp = await lottery.getLatestTimeStamp()

                              await expect(lottery.getPlayer(0)).to.be.reverted
                              assert.equal(recentWinner.toString(), accounts[0].address)
                              assert.equal(lotteryState, 0)
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  winnerStartingBalance.add(lotteryEntranceFee).toString()
                              )
                              assert(endingTimeStamp > startingTimeStamp)

                              resolve()
                          } catch (error) {
                              console.log(error)
                              reject(error)
                          }
                      })

                      // Then enter the lottery
                      console.log("Entering the lottery...")
                      const tx = await lottery.enterLottery({ value: lotteryEntranceFee })
                      await tx.wait(3)
                      console.log("Waiting for lottery to end...")
                      const winnerStartingBalance = await accounts[0].getBalance()
                  })
              })
          })
      })
