import db from "../../database/models";

async function list_all_wallets(req, res) {
    try {
        let getdata = await db.users.findAll(req.body);
        if (getdata) {
            res.json({
                success: true,
                message: "list_all_wallets",
                data: getdata
            });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: `***list_all_wallets -> ${err}`
        });
    }
}

async function create_wallet(req, res) {
    let walletAddress = req.body.walletAddress;
    try {
        let checkdata = await db.users.findOne({ where: { wallet: walletAddress } });
        if (checkdata) {
            res.json({
                message: `create_wallet: ${walletAddress} already exists`,
                data: checkdata
            });
        } else {
            let createdata = await db.users.create({ wallet: walletAddress });
            if (createdata) {
                res.json({
                    success: true,
                    message: `create_wallet: ${walletAddress}`,
                    data: createdata
                });
            }
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: `create_wallet: ${walletAddress} -> ${err}`
        });
    }
}

export const walletController = { list_all_wallets, create_wallet };