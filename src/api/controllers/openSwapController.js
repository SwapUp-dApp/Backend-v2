// openSwapController.js
import db from "../../database/models"
import { Op } from "sequelize"
import {
    OfferType,
    SwapMode,
    SwapStatus,
    NotificationStatus
} from "../utils/constants.js"
import { tryParseJSON, createNotification } from "../utils/helpers"
import { updateUserTagsIfFirstTrade } from "../utils/userTagsUpdater"
import logger from "../../logger"
import { handleError } from "../../errors"

const createOpenSwap = async (req, res) => {
    try {
        const metadata = req.body.metadata
        const swap_preferences = req.body.swap_preferences
        logger.info(metadata)
        const response = await db.swaps.create({
            metadata: JSON.stringify(metadata),
            init_address: req.body.init_address.trim(),
            swap_mode: req.body.swap_mode,
            open_trade_id: req.body.open_trade_id,
            trading_chain: req.body.trading_chain,
            swap_preferences: JSON.stringify(swap_preferences),

            status: SwapStatus.PENDING,
            offer_type: OfferType.PRIMARY,
            trade_id: null
        })
        if (response) {
            res.json({
                success: true,
                message: "create_open_swap",
                data: response
            })
        }
    } catch (err) {
        handleError(res, err, "create_open_swap error")
    }
}

const getOpenSwapList = async (req, res) => {
    try {
        const response = await db.swaps.findAll({
            where: {
                [Op.and]: [
                    { status: SwapStatus.PENDING },
                    { swap_mode: SwapMode.OPEN },
                    { accept_address: null }
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
                message: "get_open_swap_list",
                data: formattedResponse
            })
        }
    } catch (err) {
        handleError(res, err, "get_open_swap_list error")
    }
}

const getMyOpenSwapList = async (req, res) => {
    try {
        const response = await db.swaps.findAll({
            where: {
                [Op.and]: {
                    swap_mode: SwapMode.OPEN,
                    trade_id: null,
                    accept_address: null,
                    init_address: req.query.address,
                    status: SwapStatus.PENDING
                }
            }
        })

        // Convert metadata and swap_preferences to JSON if they are valid JSON strings
        const formattedResponsePromises = response.map(async (swap) => {
            const swapJSON = swap.toJSON()
            let formattedSwap = {
                ...swapJSON,
                metadata: tryParseJSON(swapJSON.metadata),
                swap_preferences: tryParseJSON(swapJSON.swap_preferences),
                created_at: swapJSON.createdAt,
                updated_at: swapJSON.updatedAt,
                number_of_offers: 0
            }

            if (swapJSON.swap_mode === 0) {
                const numberofoffers = await db.swaps.findAll({
                    where: {
                        open_trade_id: swapJSON.open_trade_id,
                        swap_preferences: null
                    }
                })
                if (numberofoffers) {
                    formattedSwap.number_of_offers = numberofoffers.length
                }
            } else {
                formattedSwap.number_of_offers = 0
            }

            delete formattedSwap.createdAt
            delete formattedSwap.updatedAt
            return formattedSwap
        })

        // Await all promises to resolve
        const formattedResponse = await Promise.all(formattedResponsePromises)

        res.json({
            success: true,
            message: "get_my_open_swap_list",
            data: formattedResponse
        })
    } catch (err) {
        handleError(res, err, "get_my_open_swap_list error")
    }
}

const getSwapPreferences = async (req, res) => {
    try {
        const response = await db.swaps.findOne({
            where: {
                [Op.and]: [
                    { swap_mode: SwapMode.OPEN },
                    { open_trade_id: req.query.open_trade_id },
                    { trade_id: null }
                ]
            }
        })

        // Convert metadata and swap_preferences to JSON if they are valid JSON strings
        const formattedResponse = () => {
            const swapJSON = swap.toJSON()
            const formattedSwap = {
                swap_preferences: tryParseJSON(swapJSON.swap_preferences)
            }
            // Remove original createdAt and updatedAt fields

            return formattedSwap
        }

        if (response) {
            res.json({
                success: true,
                message: "get_open_swap_preference_against_id",
                data: formattedResponse()
            })
        }
    } catch (err) {
        handleError(res, err, "get_open_swap_preference_against_id error")
    }
}

const proposeOpenSwap = async (req, res) => {
    try {
        const {
            trade_id,
            metadata,
            init_address,
            init_sign,
            open_trade_id,
            id,
            accept_address,
            trading_chain
        } = req.body //trade_id //metadata is accept_meta // open_trade_id

        const swap = await db.swaps.findByPk(id)
        if (!swap || swap.status !== SwapStatus.PENDING) {
            return res.status(400).json({
                success: false,
                message: "Invalid swap ID or swap is not open"
            })
        }

        const response = await db.swaps.create({
            metadata: JSON.stringify(metadata),
            status: SwapStatus.PENDING,
            init_address: init_address.trim(),
            init_sign: init_sign.trim(),
            accept_address: accept_address.trim(), // init_address will be reterieved from db , against open_trade_id
            trade_id: trade_id.trim(),
            open_trade_id: open_trade_id.trim(),
            trading_chain: trading_chain.trim(),
            offer_type: OfferType.PRIMARY,
            swap_mode: SwapMode.OPEN
        })
        try {
            await createNotification(
                req.body.accept_address.trim(),
                req.body.init_address.trim(),
                NotificationStatus.RECEIVED,
                req.body.open_trade_id
            )
        } catch (err) {
            console.error(err)
        } finally {
            if (response) {
                res.json({
                    success: true,
                    message: "propose_open_swap",
                    data: response
                })
            }
        }
    } catch (err) {
        handleError(res, err, "propose_open_swap error")
    }
}

//used when a user closes their own Open Market Swap
const closeOpenSwapOffers = async (req, res) => {
    try {
        const { open_trade_id } = req.body // delete all offers based on open_trade_id

        const response = await db.sequelize.transaction(async (t) => {
            const updateOffers = await db.swaps.update(
                { status: SwapStatus.DECLINED },
                {
                    where: { trade_id: swapId, status: SwapStatus.PENDING },
                    transaction: t
                }
            )

            const updateSwap = await db.swaps.update(
                { status: SwapStatus.CANCELLED },
                { where: { id: swapId }, transaction: t }
            )

            return { updateOffers, updateSwap }
        })

        if (response) {
            res.json({
                success: true,
                message: "close_open_swap_offers",
                data: response
            })
        }
    } catch (err) {
        handleError(res, err, "close_open_swap_offers error")
    }
}

//this will cancel an Open Market Swap offer - which will decline all proposal i.e update their status to cancelled
const cancelSwapOffer = async (req, res) => {
    try {
        const { open_trade_id, swap_mode, trade_id } = req.body // delete all offers based on open_trade_id
        let response
        if (swap_mode === SwapMode.OPEN) {
            response = await db.sequelize.transaction(async (t) => {
                const closeOrigOpenSwap = await db.swaps.update(
                    { status: SwapStatus.CANCELLED },
                    {
                        where: {
                            open_trade_id: open_trade_id,
                            accept_address: null,
                            status: SwapStatus.PENDING
                        },
                        transaction: t
                    }
                )

                const declineOffers = await db.swaps.update(
                    { status: SwapStatus.DECLINED },
                    {
                        where: {
                            open_trade_id: open_trade_id,
                            status: SwapStatus.PENDING
                        },
                        transaction: t
                    }
                )

                return { closeOrigOpenSwap, declineOffers }
            })
        }
        if (swap_mode === SwapMode.PRIVATE) {
            response = await db.sequelize.transaction(async (t) => {
                const updateOffers = await db.swaps.update(
                    { status: SwapStatus.CANCELLED },
                    {
                        where: {
                            trade_id: trade_id,
                            status: SwapStatus.PENDING
                        },
                        transaction: t
                    }
                )

                return { updateOffers }
            })
        }
        try {
            if (swap_mode === SwapMode.OPEN) {
                const receiverAddresses = (
                    await db.notifications.findAll({
                        attributes: ["originator_address"],
                        where: {
                            trade_id: open_trade_id // The condition for selection
                        },
                        raw: true
                    })
                ).map((address) => address.originator_address)
                const originatorAddress = (
                    await db.notifications.findOne({
                        attributes: ["receiver_address"],
                        where: {
                            trade_id: open_trade_id // The condition for selection
                        },
                        raw: true
                    })
                ).receiver_address
                console.log("addresses", receiverAddresses, originatorAddress)
                receiverAddresses.forEach(async (address) => {
                    await createNotification(
                        address,
                        originatorAddress,
                        NotificationStatus.CANCELLED,
                        open_trade_id
                    )
                })
            } else {
                const { receiver_address, originator_address } =
                    await db.notifications.findOne({
                        attributes: ["receiver_address", "originator_address"],
                        where: {
                            trade_id // The condition for selection
                        }
                    })
                await createNotification(
                    receiver_address,
                    originator_address,
                    NotificationStatus.CANCELLED,
                    trade_id
                )
            }
        } catch (err) {
            console.error(err)
        } finally {
            if (response) {
                res.json({
                    success: true,
                    message: "cancel_open_swap_offers",
                    data: response
                })
            }
        }
    } catch (err) {
        handleError(res, err, "cancel_open_swap_offers error")
    }
}

const acceptOpenSwap = async (req, res) => {
    try {
        const { accept_sign, tx, notes, timestamp, id, accept_address } =
            req.body //accept offer based on trade_id and remove all other open_trade_id's
        const swap = await db.swaps.findByPk(id)
        console.log("swap", swap.init_address)

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
                    accept_address: accept_address.trim(),
                    accept_sign: accept_sign.trim(),
                    status: SwapStatus.COMPLETED,
                    tx: tx,
                    notes: notes,
                    timestamp: timestamp
                },
                { transaction: t }
            )

            const declineOffers = await db.swaps.update(
                { status: SwapStatus.DECLINED },
                {
                    where: {
                        open_trade_id: swap.open_trade_id,
                        accept_address: swap.accept_address,
                        status: SwapStatus.PENDING
                    },
                    transaction: t
                }
            )

            const closeOrigOpenSwap = await db.swaps.update(
                { status: SwapStatus.COMPLETED },
                {
                    where: {
                        open_trade_id: swap.open_trade_id,
                        accept_address: null,
                        status: SwapStatus.PENDING
                    },
                    transaction: t
                }
            )

            // Update tags for both users
            await updateUserTagsIfFirstTrade(
                db,
                swap.init_address,
                accept_address,
                t
            )

            return { updateSwap, declineOffers, closeOrigOpenSwap }
        })

        try {
            const originatorAddress = (
                await db.notifications.findOne({
                    attributes: ["receiver_address"], // The column you want to select
                    where: {
                        trade_id: swap.open_trade_id // The condition for selection
                    },
                    raw: true
                })
            ).receiver_address
            const receiverAddresses = (
                await db.notifications.findAll({
                    attributes: ["originator_address"], // The column you want to select
                    where: {
                        trade_id: swap.open_trade_id // The condition for selection
                    },
                    raw: true
                })
            ).map((address) => address.originator_address)
            receiverAddresses.forEach(async (address) => {
                address !== swap.init_address
                    ? await createNotification(
                          address,
                          originatorAddress,
                          NotificationStatus.REJECTED,
                          swap.open_trade_id
                      )
                    : await createNotification(
                          address,
                          originatorAddress,
                          NotificationStatus.COMPLETED,
                          swap.open_trade_id
                      )
            })
        } catch (err) {
            console.error(err)
        } finally {
            if (response) {
                res.json({
                    success: true,
                    message: "accept_open_swap",
                    data: response
                })
            }
        }
    } catch (err) {
        handleError(res, err, "accept_open_swap error")
    }
}

//we are rejecting a swap proposal against an Open Market Swap
const rejectSwapOffer = async (req, res) => {
    try {
        const id = req.query.id //reject offer based on id
        const swap = await db.swaps.findByPk(id)
        if (!swap || swap.status !== SwapStatus.PENDING) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid swap ID or swap is not in a valid state for rejection"
            })
        }

        const response = await db.sequelize.transaction(async (t) => {
            const updateSwap = await swap.update(
                {
                    status: SwapStatus.DECLINED
                },
                { transaction: t }
            )
            return { updateSwap }
        })
        try {
            await createNotification(
                swap.init_address,
                swap.accept_address,
                swap.offer_type === OfferType.PRIMARY
                    ? NotificationStatus.REJECTED
                    : NotificationStatus.COUNTER_REJECTED,
                id
            )
        } catch (err) {
            console.error(err)
        } finally {
            if (response) {
                res.json({
                    success: true,
                    message: "rejected_swap",
                    data: response
                })
            }
        }
    } catch (err) {
        handleError(res, err, "rejected_swap error")
    }
}

export const openSwapController = {
    createOpenSwap,
    getOpenSwapList,
    proposeOpenSwap,
    cancelSwapOffer,
    acceptOpenSwap,
    getSwapPreferences,
    rejectSwapOffer,
    getMyOpenSwapList
}
