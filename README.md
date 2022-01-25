# Ouro Auto Compound

#### 初版介绍
1. 目前的auto compound是质押ogs，赚取ogs

2. assetContract即质押资产固定为ogs，由此Ouro_Auto_ogs合约设定为不需要构造函数

3. 由于solidity的特性，关于什么时候把用户的利息拿去compound(即用户积攒到何时的利息再拿去投资)，必须得有外部触发机制

   初版的auto compound定义为:

   **auto ogs pool中，每当有用户执行withdraw或deposit操作，清算并当前pool中所有用户，并触发当前pool中所有用户的compound**

   *(注:compound的效果与auto ogs池的社区用户参与活跃程度正相关,极端情况当auto ogs池后续没有活跃社区用户时,无compound效果,即与manual的效果相同)*

4. 当用户执行deposit操作后，用户资金押入pool中开启auto compound；当用户执行deposi操作时，结算用户目前的所有收益

5. 因为用户在执行外部操作时将进行pool中所有用户的清算并执行所有用户的compound，由是claimRewards没有任何意义，返回值始终为0，即用户的利息已经变为质押的本金，如果要取出，因为采用withdraw来取出质押的本金利息

