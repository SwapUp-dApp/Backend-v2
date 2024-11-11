import db from "../../database/models"
import { Op } from "sequelize"
import {
    OfferType,
    SwapStatus,
    SwapMode,
    NotificationStatus
} from "../utils/constants.js"
import { tryParseJSON, createNotification } from "../utils/helpers"
import { updateUserTagsIfFirstTrade } from "../utils/userTagsUpdater"
import Environment from "../../config"
import logger from "../../logger"
import { handleError } from "../../errors"

function test(req, res) {
    //testDb();
    res.send({ network: Environment.NETWORK_ID })
}

const newSwap = async (req, res) => {
    try {
        var metadata = req.body.metadata

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
        })
        try {
            await createNotification(
                req.body.accept_address.trim(),
                req.body.init_address.trim(),
                NotificationStatus.RECEIVED,
                req.body.trade_id
            )
        } catch (err) {
            console.error(err)
        } finally {
            if (response) {
                res.json({
                    success: true,
                    message: "new_swap",
                    data: response
                })
            }
        }
    } catch (err) {
        handleError(res, err, "***new_swap error error")
    }
}

const counterSwapOffer = async (req, res) => {
    const {
        metadata,
        init_sign,
        init_address,
        accept_address,
        id,
        open_trade_id,
        trading_chain,
        trade_id
    } = req.body
    try {
        const response = await db.swaps.update(
            {
                metadata: JSON.stringify(metadata),
                init_address: init_address.trim(),
                accept_address: accept_address.trim(),
                init_sign: init_sign.trim(),
                open_trade_id: open_trade_id ? open_trade_id : null,
                trading_chain: trading_chain,
                status: SwapStatus.PENDING,
                offer_type: OfferType.COUNTER
            },
            { where: { id: id } }
        )
        try {
            await createNotification(
                accept_address.trim(),
                init_address.trim(),
                NotificationStatus.COUNTERED,
                trade_id
            )
        } catch (err) {
            console.error(err)
        } finally {
            if (response) {
                res.json({
                    success: true,
                    message: "update_swap",
                    data: response
                })
            }
        }
    } catch (err) {
        handleError(res, err, "***update_swap error error")
    }
}

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
        )

        if (response) {
            res.json({
                success: true,
                message: "update_swap_status",
                data: response
            })
        }
    } catch (err) {
        handleError(res, err, "***update_swap_status error")
    }
}

const getSwapDetails = async (req, res) => {
    try {
        const tradeOrOpenTradeId = req.params.trade_or_open_trade_id

        // First, check if a swap exists with trade_id equal to the provided tradeOrOpenTradeId
        let response = await db.swaps.findOne({
            where: {
                trade_id: tradeOrOpenTradeId
            }
        })

        // If no swap found with trade_id, check by open_trade_id
        if (!response) {
            response = await db.swaps.findOne({
                where: {
                    [Op.and]: [
                        { swap_mode: SwapMode.OPEN },
                        { open_trade_id: tradeOrOpenTradeId },
                        { trade_id: null }
                    ]
                }
            })
        }

        // If no swap is found with either trade_id or open_trade_id, return an error
        if (!response) {
            return res.json({
                success: false,
                message: "Swap not found"
            })
        }

        // Convert metadata and swap_preferences to JSON if they are valid JSON strings
        const formattedResponse = async () => {
            const swapJSON = response.toJSON()

            let formattedSwap = {
                ...swapJSON,
                metadata: tryParseJSON(swapJSON.metadata),
                created_at: swapJSON.createdAt,
                updated_at: swapJSON.updatedAt,
                swap_preferences: null
            }

            if (swapJSON.swap_mode === SwapMode.OPEN) {
                if (swapJSON.swap_preferences === null) {
                    // Make second query to get swap preferences based on open_trade_id and trade_id being null
                    const preferenceSwap = await db.swaps.findOne({
                        where: {
                            open_trade_id: swapJSON.open_trade_id,
                            trade_id: null
                        }
                    })

                    if (preferenceSwap) {
                        formattedSwap.swap_preferences = tryParseJSON(
                            preferenceSwap.swap_preferences
                        )
                    }
                } else {
                    formattedSwap.swap_preferences = tryParseJSON(
                        swapJSON.swap_preferences
                    )
                }
            }

            // Remove original createdAt and updatedAt fields
            delete formattedSwap.createdAt
            delete formattedSwap.updatedAt
            return formattedSwap
        }

        // Return the formatted swap object
        res.json({
            success: true,
            message: "get_swap_details",
            data: await formattedResponse()
        })
    } catch (err) {
        handleError(res, err, "get_swap_details error")
    }
}

const getPrivatePending = async (req, res) => {
    try {
        const response = await db.swaps.findAll({
            where: {
                [Op.and]: {
                    status: 1,
                    swap_mode: SwapMode.PRIVATE,
                    [Op.or]: [
                        { accept_address: req.query.address },
                        { init_address: req.query.address }
                    ]
                }
            }
        })

        // Convert metadata and swap_preferences to JSON if they are valid JSON strings
        const formattedResponse = response.map((swap) => {
            const swapJSON = swap.toJSON()
            const formattedSwap = {
                ...swapJSON,
                metadata: tryParseJSON(swapJSON.metadata),
                created_at: swapJSON.createdAt,
                updated_at: swapJSON.updatedAt
            }
            // Remove original createdAt and updatedAt fields
            delete formattedSwap.createdAt
            delete formattedSwap.updatedAt
            return formattedSwap
        })
        if (response) {
            res.json({
                success: true,
                message: "get_private_pending_swaps",
                data: formattedResponse
            })
        }
    } catch (err) {
        handleError(res, err, "***get_pending error")
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
        })
        if (response) {
            res.json({
                success: true,
                message: "get_pending",
                data: response
            })
        }
    } catch (err) {
        handleError(res, err, "***get_pending error")
    }
}

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
        })
        if (response) {
            res.json({
                success: true,
                message: "history",
                data: response
            })
        }
    } catch (err) {
        handleError(res, err, "***history error")
    }
}

const sendSign = async (req, res) => {
    try {
        const response = await db.swaps.update(
            { init_sign: req.body.sign },
            { where: { init_address: req.body.address } }
        )
        if (response) {
            res.json({
                success: true,
                message: "send_sign",
                data: response
            })
        }
    } catch (err) {
        handleError(res, err, "***send_sign error")
    }
}

const getPendingSwaps = async (req, res) => {
    const { address } = req.query
    logger.info("wallet", address)

    try {
        const response = await db.swaps.findAll({
            where: {
                status: SwapStatus.PENDING,
                swap_preferences: null,
                [Op.or]: [
                    { accept_address: address },
                    { init_address: address }
                ]
            }
        })

        // Convert metadata and swap_preferences to JSON if they are valid JSON strings
        const formattedResponse = response.map((swap) => {
            const swapJSON = swap.toJSON()
            const formattedSwap = {
                ...swapJSON,
                metadata: tryParseJSON(swapJSON.metadata),
                swap_preferences: tryParseJSON(swapJSON.swap_preferences),
                created_at: swapJSON.createdAt,
                updated_at: swapJSON.updatedAt
            }
            // Remove original createdAt and updatedAt fields
            delete formattedSwap.createdAt
            delete formattedSwap.updatedAt
            return formattedSwap
        })
        if (response) {
            res.json({
                success: true,
                message: "get__pending_swaps",
                data: formattedResponse
            })
        }
    } catch (err) {
        handleError(res, err, "***get_pending error")
    }
}

const getSwapHistory = async (req, res) => {
    const { address } = req.query

    try {
        const response = await db.swaps.findAll({
            where: {
                swap_preferences: null,
                [Op.or]: [
                    { accept_address: address },
                    { init_address: address }
                ],
                status: {
                    [Op.not]: SwapStatus.PENDING
                }
            }
        })

        // Convert metadata and swap_preferences to JSON if they are valid JSON strings
        const formattedResponse = response.map((swap) => {
            const swapJSON = swap.toJSON()

            const formattedSwap = {
                ...swapJSON,
                metadata: tryParseJSON(swapJSON.metadata),
                swap_preferences: tryParseJSON(swapJSON.swap_preferences),
                created_at: swapJSON.createdAt,
                updated_at: swapJSON.updatedAt
            }

            // Remove original createdAt and updatedAt fields
            delete formattedSwap.createdAt
            delete formattedSwap.updatedAt
            return formattedSwap
        })
        if (response) {
            res.json({
                success: true,
                message: "get__swap_history",
                data: formattedResponse
            })
        }
    } catch (err) {
        handleError(res, err, "***get__swap_history error")
    }
}

const acceptPrivateSwap = async (req, res) => {
    try {
        const { accept_sign, tx, notes, timestamp, id, accept_address } =
            req.body //accept offer based on trade_id and remove all other open_trade_id's
        const swap = await db.swaps.findByPk(id)
        if (!swap || swap.status !== SwapStatus.PENDING) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid swap ID or swap is not in a valid state for acceptance"
            })
        }

        const response = await db.sequelize.transaction(async (t) => {
            const updateSwap = await swap.update(
                {
                    accept_address: accept_address.trim() || "",
                    accept_sign: accept_sign.trim() || "",
                    status: SwapStatus.COMPLETED,
                    tx: tx,
                    notes: notes,
                    timestamp: timestamp
                },
                { transaction: t }
            )

            // Update tags for both users
            await updateUserTagsIfFirstTrade(
                db,
                swap.init_address,
                accept_address,
                t
            )

            return { updateSwap }
        })
        try {
            await createNotification(
                swap.init_address.trim(),
                accept_address.trim(),
                NotificationStatus.COMPLETED,
                swap.trade_id
            )
        } catch (err) {
            console.error(err)
        } finally {
            if (response) {
                res.json({
                    success: true,
                    message: "accept_private_swap",
                    data: response
                })
            }
        }
    } catch (err) {
        handleError(res, err, "accept_private_swap error")
    }
}

export const swapController = {
    test,
    newSwap,
    counterSwapOffer,
    updateSwapStatus,
    getPending,
    history,
    sendSign,
    getSwapDetails,
    getPrivatePending,
    getPendingSwaps,
    getSwapHistory,
    acceptPrivateSwap
}
