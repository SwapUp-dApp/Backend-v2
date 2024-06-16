// openSwapController.js
import db from "../../database/models";
import { OfferType, SwapStatus } from '../utils/constants.js';

const handleError = (res, err, message) => {
    console.error(err);
    res.status(500).json({
        success: false,
        message: `${message} -> ${err.message || err}`
    });
};

const createOpenSwap = async (req, res) => {
    try {
        const metadata = req.body.metadata;
        const swap_preferences = req.body.swap_preferences;
        console.log(metadata)
        const response = await db.swaps.create({
            metadata: JSON.stringify(metadata),
            init_address: req.body.init_address.trim(),
            swap_mode: req.body.swap_mode,
            open_trade_id: req.body.open_trade_id,
            trading_chain: req.body.trading_chain,
            swap_preferences: JSON.stringify(swap_preferences),
            
            status: SwapStatus.PENDING,
            offer_type: OfferType.PRIMARY,
            trade_id : null,
            
        });
        if (response) {
            res.json({
                success: true,
                message: "create_open_swap",
                data: response
            });
        }
    } catch (err) {
        handleError(res, err, "create_open_swap error");
    }
};

const getOpenSwapList = async (req, res) => {
    try {
        const response = await db.swaps.findAll({
            where: {
                status: SwapStatus.PENDING 
            }
        });

        // Convert metadata and swap_preferences to JSON if they are valid JSON strings
        const formattedResponse = response.map(swap => ({
            ...swap.toJSON(),
            metadata: tryParseJSON(swap.metadata),
            swap_preferences: tryParseJSON(swap.swap_preferences)
        }));

        if (response) {
            res.json({
                success: true,
                message: "get_open_swap_list",
                data: formattedResponse
            });
        }
    } catch (err) {
        handleError(res, err, "get_open_swap_list error");
    }
};

// Helper function to parse JSON safely
function tryParseJSON(jsonString) {
    try {
        const parsed = JSON.parse(jsonString);
        return parsed;
    } catch (err) {
        return jsonString; // Return original string if parsing fails
    }
}


const proposeOpenSwap = async (req, res) => {
    try {
        const { trade_id, metadata, init_address, init_sign, open_trade_id } = req.body;  //trade_id //metadata is accept_meta // open_trade_id

        const swap = await db.swaps.findByPk(swapId);
        if (!swap || swap.status !== SwapStatus.PENDING) {
            return res.status(400).json({
                success: false,
                message: "Invalid swap ID or swap is not open"
            });
        }

        const response = await db.swaps.create({
            metadata: JSON.stringify(metadata),
            status: SwapStatus.PENDING,
            init_address: init_address.trim(),
            init_sign: init_sign.trim(),
            accept_address: accept_address.trim(), // init_address will be reterieved from db , against open_trade_id
            trade_id: trade_id,

            offer_type: OfferType.PRIMARY,
            
        });
        if (response) {
            res.json({
                success: true,
                message: "propose_open_swap",
                data: response
            });
        }
    } catch (err) {
        handleError(res, err, "propose_open_swap error");
    }
};

const closeOpenSwapOffers = async (req, res) => {
    try {
        const { open_trade_id } = req.body; // delete all offers based on open_trade_id

        const response = await db.sequelize.transaction(async (t) => {
            const updateOffers = await db.swaps.update(
                { status: SwapStatus.DECLINED },
                { where: { trade_id: swapId, status: SwapStatus.PENDING }, transaction: t }
            );

            const updateSwap = await db.swaps.update(
                { status: SwapStatus.CANCELLED },
                { where: { id: swapId }, transaction: t }
            );

            return { updateOffers, updateSwap };
        });

        if (response) {
            res.json({
                success: true,
                message: "close_open_swap_offers",
                data: response
            });
        }
    } catch (err) {
        handleError(res, err, "close_open_swap_offers error");
    }
};

const acceptOpenSwap = async (req, res) => {
    try {
        const { trade_id, open_trade_id , accept_sign } = req.body; //accept offer based on trade_id and remove all other open_trade_id's
        const swap = await db.swaps.findByPk(swapId);
        if (!swap || swap.status !== SwapStatus.PENDING) {
            return res.status(400).json({
                success: false,
                message: "Invalid swap ID or swap is not in a valid state for acceptance"
            });
        }

        const response = await db.sequelize.transaction(async (t) => {
            const updateSwap = await swap.update({
                accept_address: accept_address.trim(),
                accept_sign: accept_sign.trim(),
                status: SwapStatus.COMPLETED
            }, { transaction: t });

            const declineOffers = await db.swaps.update(
                { status: SwapStatus.DECLINED },
                { where: { trade_id: swap.trade_id, status: SwapStatus.PENDING }, transaction: t }
            );

            return { updateSwap, declineOffers };
        });

        if (response) {
            res.json({
                success: true,
                message: "accept_open_swap",
                data: response
            });
        }
    } catch (err) {
        handleError(res, err, "accept_open_swap error");
    }
};

export const openSwapController = {
    createOpenSwap,
    getOpenSwapList,
    proposeOpenSwap,
    closeOpenSwapOffers,
    acceptOpenSwap
};
