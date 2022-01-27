const ourautoogs = artifacts.require("LPStaking");
const BN = require("bn.js");
const OGS = artifacts.require("OGSToken");

const OGSToken = function(value){
    return value * 10 ** 0;
}

contract("LPStaking",async accounts =>{
    it("LPStakingTest",async()=>{
        const skipBlocks = async function(blockCount) {
            for (var i = 0; i < blockCount; ++i) {
                await web3.eth.sendTransaction({ from: accounts[3], to: accounts[3], value: 1});
            }
        };

        const oweracc = accounts[0];
        const partiacc1 = accounts[1];
        const partiacc2 = accounts[2];

        let ogstoken = await OGS.new("OGSTOKEN","OGS",0,10000);
        owerOSG = await ogstoken.balanceOf(oweracc);

        assert.equal(OGSToken(10000),owerOSG.toNumber());
        await ogstoken.batchTransfer([partiacc1,partiacc2],[OGSToken(1000),OGSToken(1000)],{ from: oweracc });

        parti1OSG = await ogstoken.balanceOf(partiacc1);
        parti2OSG = await ogstoken.balanceOf(partiacc2);
        owerOSG = await ogstoken.balanceOf(oweracc);

        assert.equal(OGSToken(1000),parti1OSG.toNumber());
        assert.equal(OGSToken(1000),parti2OSG.toNumber());
        assert.equal(OGSToken(10000-1000-1000),owerOSG.toNumber());

        //初始化lpstaking
        let blockReward = 15;
        lpstaking = await ourautoogs.new(ogstoken.address);
        await lpstaking.setBlockReward(blockReward);
        console.log("---初始化BlockReward为15---")
        console.log("")
        //设置
        await ogstoken.approve(lpstaking.address,OGSToken(1000),{from:partiacc1});
        await ogstoken.approve(lpstaking.address,OGSToken(1000),{from:partiacc2});



        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")
        console.log("---_lastRewardBlock----")
        let lastRewardBlock = await lpstaking._lastRewardBlock()
        console.log(lastRewardBlock.toNumber())
        console.log("")
        //第一个用户存了500
        console.log("***用户A质押500 ogs***")
        await lpstaking.deposit(OGSToken(500),{from : partiacc1});
        console.log("") 

        console.log("---_lastRewardBlock----")
        lastRewardBlock = await lpstaking._lastRewardBlock()
        console.log(lastRewardBlock.toNumber())
        console.log("") 

        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")
        
        //用户A投资情况
        console.log("===用户A投资情况|开始===")
        console.log("===质押中的本息ogs===")
        console.log((await lpstaking.numStaked(partiacc1)).toNumber())
        console.log("===待compound的利息===")
        console.log((await lpstaking.checkUncompoundReward(partiacc1)).toNumber())
        console.log("===用户A投资情况|结束===")
        console.log("")
        console.log("")
        parti1OSG = await ogstoken.balanceOf(partiacc1);
        assert.equal(OGSToken(1000-500),parti1OSG.toNumber());

        previoublock = await web3.eth.getBlockNumber();
        //手动跳过5个区块
        await skipBlocks(5);
        console.log("+++过了5个区块后...+++")
        console.log("")

        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")
        //用户A投资情况
        console.log("===用户A投资情况|开始===")
        console.log("===质押中的本息ogs===")
        console.log((await lpstaking.numStaked(partiacc1)).toNumber())
        console.log("===待compound的利息===")
        console.log((await lpstaking.checkUncompoundReward(partiacc1)).toNumber())
        console.log("===用户A投资情况|结束===")
        console.log("")
        console.log("")


        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")

        console.log("***用户B质押500 ogs***")
        console.log("")  
        //第二个用户存了500
        await lpstaking.deposit(OGSToken(500),{from : partiacc2});


        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")

        //用户A投资情况
        console.log("===用户A投资情况|开始===")
        console.log("===质押中的本息ogs===")
        console.log((await lpstaking.numStaked(partiacc1)).toNumber())
        console.log("===待compound的利息===")
        console.log((await lpstaking.checkUncompoundReward(partiacc1)).toNumber())
        console.log("===用户A投资情况|结束===")
        console.log("")

        //用户B投资情况
        console.log("===用户B投资情况|开始===")
        console.log("===质押中的本息ogs===")
        console.log((await lpstaking.numStaked(partiacc2)).toNumber())
        console.log("===待compound的利息===")
        console.log((await lpstaking.checkUncompoundReward(partiacc2)).toNumber())
        console.log("===用户B投资情况|结束===")
        console.log("")
        console.log("")
        previoublock = await web3.eth.getBlockNumber() - previoublock;
        // console.log(previoublock)
        //手动跳过5个区块
        await skipBlocks(5);
        console.log("+++过了5个区块后...+++")
        console.log("")


        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")
        //用户A投资情况
        console.log("===用户A投资情况|开始===")
        console.log("===质押中的本息ogs===")
        console.log((await lpstaking.numStaked(partiacc1)).toNumber())
        console.log("===待compound的利息===")
        console.log((await lpstaking.checkUncompoundReward(partiacc1)).toNumber())
        console.log("===用户A投资情况|结束===")
        console.log("")

        //用户B投资情况
        console.log("===用户B投资情况|开始===")
        console.log("===质押中的本息ogs===")
        console.log((await lpstaking.numStaked(partiacc2)).toNumber())
        console.log("===待compound的利息===")
        console.log((await lpstaking.checkUncompoundReward(partiacc2)).toNumber())
        console.log("===用户B投资情况|结束===")
        console.log("")
        console.log("")


        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")

        console.log("***用户A新质押了100 ogs***")
        console.log("")  
        //第一个用户再存了100
        await lpstaking.deposit(OGSToken(100),{from : partiacc1}); 


        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")

        //用户A投资情况
        console.log("===用户A投资情况|开始===")
        console.log("===质押中的本息ogs===")
        console.log((await lpstaking.numStaked(partiacc1)).toNumber())
        console.log("===待compound的利息===")
        console.log((await lpstaking.checkUncompoundReward(partiacc1)).toNumber())
        console.log("===用户A投资情况|结束===")
        console.log("")

        //用户B投资情况
        console.log("===用户B投资情况|开始===")
        console.log("===质押中的本息ogs===")
        console.log((await lpstaking.numStaked(partiacc2)).toNumber())
        console.log("===待compound的利息===")
        console.log((await lpstaking.checkUncompoundReward(partiacc2)).toNumber())
        console.log("===用户B投资情况|结束===")
        console.log("")
        console.log("")


        //手动跳过5个区块
        await skipBlocks(5);
        console.log("+++过了5个区块后...+++")
        console.log("")


        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")
        //用户A投资情况
        console.log("===用户A投资情况|开始===")
        console.log("===质押中的本息ogs===")
        console.log((await lpstaking.numStaked(partiacc1)).toNumber())
        console.log("===待compound的利息===")
        console.log((await lpstaking.checkUncompoundReward(partiacc1)).toNumber())
        console.log("===用户A投资情况|结束===")
        console.log("")

        //用户B投资情况
        console.log("===用户B投资情况|开始===")
        console.log("===质押中的本息ogs===")
        console.log((await lpstaking.numStaked(partiacc2)).toNumber())
        console.log("===待compound的利息===")
        console.log((await lpstaking.checkUncompoundReward(partiacc2)).toNumber())
        console.log("===用户B投资情况|结束===")
        console.log("")
        console.log("")



        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")
        //第一个用户取了50
        console.log("***用户A取款了50 ogs***")
        console.log("")  
        await lpstaking.withdraw(OGSToken(50),{from : partiacc1}); 

        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")

        //用户A投资情况
        console.log("===用户A投资情况|开始===")
        console.log("===质押中的本息ogs===")
        console.log((await lpstaking.numStaked(partiacc1)).toNumber())
        console.log("===待compound的利息===")
        console.log((await lpstaking.checkUncompoundReward(partiacc1)).toNumber())
        console.log("===用户A投资情况|结束===")
        console.log("")

        //用户B投资情况
        console.log("===用户B投资情况|开始===")
        console.log("===质押中的本息ogs===")
        console.log((await lpstaking.numStaked(partiacc2)).toNumber())
        console.log("===待compound的利息===")
        console.log((await lpstaking.checkUncompoundReward(partiacc2)).toNumber())
        console.log("===用户B投资情况|结束===")
        console.log("")
        console.log("")



        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")
        //第二个用户再存了300
        console.log("***用户B新质押了300 ogs***")  
        console.log("")
        await lpstaking.deposit(OGSToken(300),{from : partiacc2});

        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")

        //用户A投资情况
        console.log("===用户A投资情况|开始===")
        console.log("===质押中的本息ogs===")
        console.log((await lpstaking.numStaked(partiacc1)).toNumber())
        console.log("===待compound的利息===")
        console.log((await lpstaking.checkUncompoundReward(partiacc1)).toNumber())
        console.log("===用户A投资情况|结束===")
        console.log("")

        //用户B投资情况
        console.log("===用户B投资情况|开始===")
        console.log("===质押中的本息ogs===")
        console.log((await lpstaking.numStaked(partiacc2)).toNumber())
        console.log("===待compound的利息===")
        console.log((await lpstaking.checkUncompoundReward(partiacc2)).toNumber())
        console.log("===用户B投资情况|结束===")
        console.log("")
        console.log("")


        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")

        //第二个用户取了50
        console.log("***用户B取款了50 ogs***")  
        console.log("")
        await lpstaking.withdraw(OGSToken(50),{from : partiacc2}); 

        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")

        //用户A投资情况
        console.log("===用户A投资情况|开始===")
        console.log("===质押中的本息ogs===")
        console.log((await lpstaking.numStaked(partiacc1)).toNumber())
        console.log("===待compound的利息===")
        console.log((await lpstaking.checkUncompoundReward(partiacc1)).toNumber())
        console.log("===用户A投资情况|结束===")
        console.log("")

        //用户B投资情况
        console.log("===用户B投资情况|开始===")
        console.log("===质押中的本息ogs===")
        console.log((await lpstaking.numStaked(partiacc2)).toNumber())
        console.log("===待compound的利息===")
        console.log((await lpstaking.checkUncompoundReward(partiacc2)).toNumber())
        console.log("===用户B投资情况|结束===")
        console.log("")
        console.log("")






    });
})