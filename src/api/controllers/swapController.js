import db from "../../database/models";
import { Op } from "sequelize";
import { OfferType, SwapStatus, SwapMode } from '../utils/constants.js';

function test(req, res) {
    //testDb();
    res.send({ network: process.env.NETWORK });
}

const newSwap = async (req, res) => {
    try {
        var metadata = req.body.metadata;

        const response = await db.swaps.create({
            metadata: JSON.stringify(metadata),
            init_address: req.body.init_address.trim(),
            accept_address: req.body.accept_address.trim(),
            init_sign: req.body.init_sign.trim(),

            swap_mode: req.body.swap_mode,
            open_trade_id: null,
            trading_chain: req.body.trading_chain,
            status: SwapStatus.PENDING,
            offer_type: req.body.offer_type,
            trade_id: req.body.trade_id,
            swap_preferences: null


        });
        if (response) {
            res.json({
                success: true,
                message: "new_swap",
                data: response
            });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: `***new_swap error -> ${err}`
        });
    }
};

const updateSwap = async (req, res) => {
    try {
        var metadata = req.body.metadata;

        console.log("req", req);
        const response = await db.swaps.update(
            {
                metadata: JSON.stringify(metadata),
                // status: 1, //1 is pending
                init_address: "" + req.body.init_address.trim(),
                accept_address: "" + req.body.accept_address.trim(),
                init_sign: "" + req.body.init_sign.trim(),

                swap_mode: req.body.swap_mode,
                open_trade_id: null,
                trading_chain: req.body.trading_chain,
                status: SwapStatus.PENDING,
                offer_type: req.body.offer_type,
                trade_id: req.body.trade_id,
                swap_preferences: null,

            },
            { where: { id: req.body.id } }
        );

        if (response) {
            res.json({
                success: true,
                message: "update_swap",
                data: response
            });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: `***update_swap error -> ${err}`
        });
    }
};

const updateSwapStatus = async (req, res) => {
    try {
        const response = await db.swaps.update(
            {
                status: req.body.status,
                tx: "" + req.body.txn,
                notes: "" + req.body.notes,
                metadata: req.body.metadata,
                timestamp: req.body.timestamp,

                swap_mode: req.body.swap_mode,
                open_trade_id: null,
                trading_chain: req.body.trading_chain,
                status: SwapStatus.PENDING,
                offer_type: req.body.offer_type,
                trade_id: req.body.trade_id,
                swap_preferences: null
            },
            { where: { id: req.body.id } }
        );

        if (response) {
            res.json({
                success: true,
                message: "update_swap_status",
                data: response
            });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: `***update_swap_status -> ${err}`
        });
    }
};

//open trade if passed - returns proposals against that id - getSwapProposals


//takes trade id and returns entire swap object with preferences from original open market trade entry
const getSwapDetails = async (req, res) => {
    try {
        const response = await db.swaps.findOne({
            where: {
                trade_id: req.query.trade_id,
            }
        });

        if (!response) {
            return res.json({
                success: false,
                message: "Swap not found",
            });
        }

        // Convert metadata and swap_preferences to JSON if they are valid JSON strings
        const formattedResponse = async () => {
            const swapJSON = response.toJSON();
            let formattedSwap = {
                ...swapJSON,
                metadata: tryParseJSON(swapJSON.metadata),
                created_at: swapJSON.createdAt,
                updated_at: swapJSON.updatedAt,
                swap_preferences: null,
            };

            if (swapJSON.swap_mode === SwapMode.OPEN) {
                if (swapJSON.swap_preferences === null) {
                    // Make second query to get swap preferences based on open_trade_id and trade_id being null
                    const preferenceSwap = await db.swaps.findOne({
                        where: {
                            open_trade_id: swapJSON.open_trade_id,
                            trade_id: null,
                        }
                    });

                    if (preferenceSwap) {
                        formattedSwap.swap_preferences = tryParseJSON(preferenceSwap.swap_preferences);
                    }
                } else {
                    formattedSwap.swap_preferences = tryParseJSON(swapJSON.swap_preferences);
                }
            }

            // Remove original createdAt and updatedAt fields
            delete formattedSwap.createdAt;
            delete formattedSwap.updatedAt;
            return formattedSwap;
        };

        res.json({
            success: true,
            message: "get_swap_details_against_trade_id",
            data: await formattedResponse()
        });
    } catch (err) {
        handleError(res, err, "get_swap_details_against_trade_id error");
    }
};

const getPrivatePending = async (req, res) => {

    try {
        const response = await db.swaps.findAll({
            where: {
                [Op.and]: {
                    status: 1,
                    swap_mode: SwapMode.PRIVATE,
                    [Op.or]: [
                        { accept_address: req.query.address },
                        { init_address: req.query.address },
                    ]
                }
            }
        });

        // Convert metadata and swap_preferences to JSON if they are valid JSON strings
        const formattedResponse = response.map(swap => {
            const swapJSON = swap.toJSON();
            const formattedSwap = {
                ...swapJSON,
                metadata: tryParseJSON(swapJSON.metadata),
                created_at: swapJSON.createdAt,
                updated_at: swapJSON.updatedAt,
            };
            // Remove original createdAt and updatedAt fields
            delete formattedSwap.createdAt;
            delete formattedSwap.updatedAt;
            return formattedSwap;
        });
        if (response) {
            res.json({
                success: true,
                message: "get_private_pending_swaps",
                data: formattedResponse
            });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: `***get_pending error -> ${err}`
        });
    }
};

//helper function to parse JSON
// Helper function to parse JSON safely
function tryParseJSON(jsonString) {
    try {
        const parsed = JSON.parse(jsonString);
        return parsed;
    } catch (err) {
        return jsonString; // Return original string if parsing fails
    }
}


const getPending = async (req, res) => {
    try {
        const response = await db.swaps.findAll({
            where: {
                [Op.and]: {
                    status: 1,
                    [Op.or]: [
                        { accept_address: req.query.address },
                        { init_address: req.query.address }
                    ]
                }
            }
        });
        if (response) {
            res.json({
                success: true,
                message: "get_pending",
                data: response
            });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: `***get_pending error -> ${err}`
        });
    }
};

const history = async (req, res) => {
    try {
        const response = await db.swaps.findAll({
            //attributes: ["createdAt", "status"],
            where: {
                [Op.or]: [
                    { accept_address: req.query.address },
                    { init_address: req.query.address }
                ]
            }
        });
        if (response) {
            res.json({
                success: true,
                message: "history",
                data: response
            });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: `***history error -> ${err}`
        });
    }
};

const sendSign = async (req, res) => {
    try {
        const response = await db.swaps.update(
            { init_sign: req.body.sign },
            { where: { init_address: req.body.address } }
        );
        if (response) {
            res.json({
                success: true,
                message: "send_sign",
                data: response
            });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: `***send_sign error -> ${err}`
        });
    }
};

const getPendingSwaps = async (req, res) => {
    try {
        const response = await db.swaps.findAll({
            where: {
                [Op.and]: {
                    status: 1,
                    swap_preferences: null,
                    [Op.or]: [
                        { accept_address: req.query.address },
                        { init_address: req.query.address },
                    ]
                }
            }
        });

        // Convert metadata and swap_preferences to JSON if they are valid JSON strings
        const formattedResponse = response.map(swap => {
            const swapJSON = swap.toJSON();
            const formattedSwap = {
                ...swapJSON,
                metadata: tryParseJSON(swapJSON.metadata),
                swap_preferences: tryParseJSON(swapJSON.swap_preferences),
                created_at: swapJSON.createdAt,
                updated_at: swapJSON.updatedAt,
            };
            // Remove original createdAt and updatedAt fields
            delete formattedSwap.createdAt;
            delete formattedSwap.updatedAt;
            return formattedSwap;
        });
        if (response) {
            res.json({
                success: true,
                message: "get__pending_swaps",
                data: formattedResponse
            });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: `***get_pending error -> ${err}`
        });
    }
};

const getSwapHistory = async (req, res) => {
    try {
        const response = await db.swaps.findAll({
            where: {
                [Op.and]: {
                    swap_preferences: null,
                    [Op.or]: [
                        { accept_address: req.query.address },
                        { init_address: req.query.address },
                        {status: SwapStatus.CANCELLED},
                        {status: SwapStatus.COMPLETED},
                        {status: SwapStatus.DECLINED},
                    ]
                }
            }
        });

        // Convert metadata and swap_preferences to JSON if they are valid JSON strings
        const formattedResponse = response.map(swap => {
            const swapJSON = swap.toJSON();
            const formattedSwap = {
                ...swapJSON,
                metadata: tryParseJSON(swapJSON.metadata),
                swap_preferences: tryParseJSON(swapJSON.swap_preferences),
                created_at: swapJSON.createdAt,
                updated_at: swapJSON.updatedAt,
            };
            // Remove original createdAt and updatedAt fields
            delete formattedSwap.createdAt;
            delete formattedSwap.updatedAt;
            return formattedSwap;
        });
        if (response) {
            res.json({
                success: true,
                message: "get__swap_history",
                data: formattedResponse
            });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: `***get__swap_history -> ${err}`
        });
    }
};

export const swapController = {
    test,
    newSwap,
    updateSwap,
    updateSwapStatus,
    getPending,
    history,
    sendSign,
    getSwapDetails,
    getPrivatePending,
    getPendingSwaps,
    getSwapHistory
};
