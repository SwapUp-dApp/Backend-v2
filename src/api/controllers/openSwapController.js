// openSwapController.js
import db from "../../database/models";
import { Op } from "sequelize";
import { OfferType, SwapMode, SwapStatus, NotificationStatus } from "../utils/constants.js";
import { tryParseJSON, createNotification } from "../utils/helpers";
import { updateUserTagsIfFirstTrade } from "../utils/userTagsUpdater";
import logger from "../../logger";
import { handleError } from "../../errors";

const createOpenSwap = async (req, res) => {
    try {
        const { init_address, open_trade_id, swap_mode, trading_chain, swap_preferences, init_sign, metadata } = req.body;

        logger.info(metadata);
        const response = await db.swaps.create({
            metadata: JSON.stringify(metadata),
            init_address: init_address.trim(),
            swap_mode: swap_mode,
            open_trade_id: open_trade_id,
            trading_chain: trading_chain,
            swap_preferences: JSON.stringify(swap_preferences),
            status: SwapStatus.PENDING,
            offer_type: OfferType.PRIMARY,
            trade_id: null,
            init_sign: init_sign
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
                [Op.and]: [
                    { status: SwapStatus.PENDING },
                    { swap_mode: SwapMode.OPEN },
                    { accept_address: null }
                ]
            }
        });

        // Convert metadata and swap_preferences to JSON if they are valid JSON strings
        const formattedResponse = response.map((swap) => {
            const swapJSON = swap.toJSON();
            const formattedSwap = {
                ...swapJSON,
                metadata: tryParseJSON(swapJSON.metadata),
                swap_preferences: tryParseJSON(swapJSON.swap_preferences),
                created_at: swapJSON.createdAt,
                updated_at: swapJSON.updatedAt
            };
            // Remove original createdAt and updatedAt fields
            delete formattedSwap.createdAt;
            delete formattedSwap.updatedAt;
            return formattedSwap;
        });

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
        });

        // Convert metadata and swap_preferences to JSON if they are valid JSON strings
        const formattedResponsePromises = response.map(async (swap) => {
            const swapJSON = swap.toJSON();
            let formattedSwap = {
                ...swapJSON,
                metadata: tryParseJSON(swapJSON.metadata),
                swap_preferences: tryParseJSON(swapJSON.swap_preferences),
                created_at: swapJSON.createdAt,
                updated_at: swapJSON.updatedAt,
                number_of_offers: 0
            };

            if (swapJSON.swap_mode === 0) {
                const numberofoffers = await db.swaps.findAll({
                    where: {
                        open_trade_id: swapJSON.open_trade_id,
                        swap_preferences: null
                    }
                });
                if (numberofoffers) {
                    formattedSwap.number_of_offers = numberofoffers.length;
                }
            } else {
                formattedSwap.number_of_offers = 0;
            }

            delete formattedSwap.createdAt;
            delete formattedSwap.updatedAt;
            return formattedSwap;
        });

        // Await all promises to resolve
        const formattedResponse = await Promise.all(formattedResponsePromises);

        res.json({
            success: true,
            message: "get_my_open_swap_list",
            data: formattedResponse
        });
    } catch (err) {
        handleError(res, err, "get_my_open_swap_list error");
    }
};

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
        });

        // Convert metadata and swap_preferences to JSON if they are valid JSON strings
        const formattedResponse = () => {
            const swapJSON = swap.toJSON();
            const formattedSwap = {
                swap_preferences: tryParseJSON(swapJSON.swap_preferences)
            };
            // Remove original createdAt and updatedAt fields

            return formattedSwap;
        };

        if (response) {
            res.json({
                success: true,
                message: "get_open_swap_preference_against_id",
                data: formattedResponse()
            });
        }
    } catch (err) {
        handleError(res, err, "get_open_swap_preference_against_id error");
    }
};

const proposeOpenSwap = async (req, res) => {
    try {
        const { trade_id, metadata, init_address, init_sign, open_trade_id, id, accept_address, trading_chain } = req.body; //trade_id //metadata is accept_meta // open_trade_id

        const swap = await db.swaps.findByPk(id);
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
            trade_id: trade_id.trim(),
            open_trade_id: open_trade_id.trim(),
            trading_chain: trading_chain.trim(),
            offer_type: OfferType.PRIMARY,
            swap_mode: SwapMode.OPEN
        });

        try {
            await createNotification({
                originator_address: init_address.trim(),
                receiver_address: accept_address.trim(),
                trade_id: trade_id,
                open_trade_id: open_trade_id,
                swap_mode: SwapMode.OPEN,
                status: NotificationStatus.RECEIVED
            });
        } catch (err) {
            console.error(err);
        } finally {
            if (response) {
                res.json({
                    success: true,
                    message: "propose_open_swap",
                    data: response
                });
            }
        }
    } catch (err) {
        handleError(res, err, "propose_open_swap error");
    }
};

//used when a user closes their own Open Market Swap
const closeOpenSwapOffers = async (req, res) => {
    try {
        const { open_trade_id } = req.body; // delete all offers based on open_trade_id

        const response = await db.sequelize.transaction(async (t) => {
            const updateOffers = await db.swaps.update(
                { status: SwapStatus.DECLINED },
                {
                    where: { trade_id: swapId, status: SwapStatus.PENDING },
                    transaction: t
                }
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

//this will cancel an Open Market Swap offer - which will decline all proposal i.e update their status to cancelled
const cancelSwapOffer = async (req, res) => {
    try {
        const { open_trade_id, swap_mode, trade_id, sign_message } = req.body; // delete all offers based on open_trade_id
        let response;

        if (swap_mode === SwapMode.OPEN && open_trade_id) {
            response = await db.sequelize.transaction(async (t) => {
                const closeOrigOpenSwap = await db.swaps.update(
                    { status: SwapStatus.CANCELLED, init_sign: sign_message },
                    {
                        where: {
                            open_trade_id: open_trade_id,
                            accept_address: null,
                            status: SwapStatus.PENDING
                        },
                        transaction: t
                    }
                );

                const declineOffers = await db.swaps.update(
                    { status: SwapStatus.DECLINED, accept_sign: sign_message },
                    {
                        where: {
                            open_trade_id: open_trade_id,
                            status: SwapStatus.PENDING
                        },
                        transaction: t
                    }
                );

                return { closeOrigOpenSwap, declineOffers };
            });
        }

        if (swap_mode === SwapMode.PRIVATE) {
            response = await db.sequelize.transaction(async (t) => {
                const updateOffers = await db.swaps.update(
                    { status: SwapStatus.CANCELLED, init_sign: sign_message },
                    {
                        where: {
                            trade_id: trade_id,
                            status: SwapStatus.PENDING
                        },
                        transaction: t
                    }
                );

                return { updateOffers };
            });
        }

        // Notification update logic
        try {
            if (swap_mode === SwapMode.OPEN && open_trade_id) {

                const allFoundSwaps = await db.swaps.findAll({
                    where: { open_trade_id },
                    attributes: ["init_address", "accept_address", "trade_id", "open_trade_id", "swap_mode"],
                    raw: true
                });


                // Destructure swaps based on the condition
                const originalOpenSwap = allFoundSwaps.find(swap => swap.accept_address === null); // Only one swap where accept_address is null
                const restSwaps = allFoundSwaps.filter(swap => swap.accept_address !== null);


                restSwaps.forEach(async (foundSwap) => {
                    const notificationTo = (foundSwap.init_address === originalOpenSwap.init_address) ? foundSwap.accept_address : foundSwap.init_address;

                    await createNotification({
                        originator_address: originalOpenSwap.init_address,
                        receiver_address: notificationTo,
                        trade_id: foundSwap.trade_id,
                        open_trade_id: foundSwap.open_trade_id,
                        swap_mode: foundSwap.swap_mode || SwapMode.OPEN,
                        status: NotificationStatus.CANCELLED,
                    });
                });
            }

            if (swap_mode === SwapMode.PRIVATE) {
                const foundSwap = await db.swaps.findOne({
                    attributes: ["accept_address", "init_address", "trade_id", "open_trade_id", "swap_mode"],
                    where: { trade_id }
                });

                await createNotification({
                    originator_address: foundSwap.init_address,
                    receiver_address: foundSwap.accept_address,
                    trade_id: foundSwap.trade_id,
                    open_trade_id: foundSwap.open_trade_id,
                    swap_mode: foundSwap.swap_mode,
                    status: NotificationStatus.CANCELLED,
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            if (response) {
                res.json({
                    success: true,
                    message: "cancel_open_swap_offers",
                    data: response
                });
            }
        }
    } catch (err) {
        handleError(res, err, "cancel_open_swap_offers error");
    }
};

const acceptOpenSwap = async (req, res) => {
    try {
        const { accept_sign, tx, notes, timestamp, id, accept_address } = req.body; //accept offer based on trade_id and remove all other open_trade_id's
        const swap = await db.swaps.findByPk(id);
        console.log("swap", swap.init_address);

        if (!swap || swap.status !== SwapStatus.PENDING) {
            return res.status(400).json({
                success: false,
                message: "Invalid swap ID or swap is not in a valid state for acceptance"
            });
        }

        const response = await db.sequelize.transaction(async (t) => {
            const updateSwap = await swap.update(
                {
                    accept_address: accept_address.trim(),
                    accept_sign: accept_sign.trim(),
                    status: SwapStatus.COMPLETED,
                    tx,
                    notes,
                    timestamp
                },
                { transaction: t }
            );

            const declineOffers = await db.swaps.update(
                { status: SwapStatus.DECLINED, accept_sign: accept_sign.trim() },
                {
                    where: {
                        open_trade_id: swap.open_trade_id,
                        accept_address: { [Op.ne]: null }, // Condition: accept_address is not null
                        status: SwapStatus.PENDING
                    },
                    transaction: t
                }
            );

            const closeOrigOpenSwap = await db.swaps.update(
                { status: SwapStatus.COMPLETED, accept_sign: accept_sign.trim() },
                {
                    where: {
                        open_trade_id: swap.open_trade_id,
                        accept_address: null,
                        status: SwapStatus.PENDING
                    },
                    transaction: t
                }
            );

            // Update tags for both users
            await updateUserTagsIfFirstTrade(
                db,
                swap.init_address,
                accept_address,
                t
            );

            return { updateSwap, declineOffers, closeOrigOpenSwap };
        });

        try {
            const allFoundSwaps = await db.swaps.findAll({
                where: { open_trade_id: swap.open_trade_id },
                attributes: ["init_address", "accept_address", "trade_id", "open_trade_id", "swap_mode", "offer_type"],
                raw: true
            });


            // Destructure swaps based on the condition
            const originalOpenSwap = allFoundSwaps.find(foundSwap => foundSwap.accept_address === null); // Only one swap where accept_address is null
            const restSwaps = allFoundSwaps.filter(foundSwap => (foundSwap.accept_address !== null));


            restSwaps.forEach(async (foundSwap) => {
                const notificationTo = (foundSwap.init_address === originalOpenSwap.init_address) ? foundSwap.accept_address : foundSwap.init_address;

                await createNotification({
                    originator_address: (foundSwap.offer_type === OfferType.COUNTER) ? foundSwap.accept_address : originalOpenSwap.init_address,
                    receiver_address: (foundSwap.offer_type === OfferType.COUNTER) ? foundSwap.init_address : notificationTo,
                    trade_id: foundSwap.trade_id,
                    open_trade_id: foundSwap.open_trade_id,
                    swap_mode: foundSwap.swap_mode,
                    status: (swap.trade_id === foundSwap.trade_id) ? NotificationStatus.COMPLETED : NotificationStatus.REJECTED,
                });
            });
        } catch (err) {
            console.error(err);
        } finally {
            if (response) {
                res.json({
                    success: true,
                    message: "accept_open_swap",
                    data: response
                });
            }
        }
    } catch (err) {
        handleError(res, err, "accept_open_swap error");
    }
};

//we are rejecting a swap proposal against an Open Market Swap
const rejectSwapOffer = async (req, res) => {
    try {
        const id = req.query.id; //reject offer based on id
        const swap = await db.swaps.findByPk(id);
        const { sign_message } = req.body;

        if (!swap || swap.status !== SwapStatus.PENDING) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid swap ID or swap is not in a valid state for rejection"
            });
        }

        const response = await db.sequelize.transaction(async (t) => {
            const updateSwap = await swap.update(
                {
                    status: SwapStatus.DECLINED,
                    accept_sign: sign_message
                },
                { transaction: t }
            );
            return { updateSwap };
        });

        try {
            await createNotification({
                originator_address: swap.accept_address,
                receiver_address: swap.init_address,
                trade_id: swap.trade_id,
                open_trade_id: swap.open_trade_id,
                swap_mode: swap.swap_mode,
                status: (swap.offer_type === OfferType.PRIMARY) ? NotificationStatus.REJECTED : NotificationStatus.COUNTER_REJECTED,
            });
        } catch (err) {
            console.error(err);
        } finally {
            if (response) {
                res.json({
                    success: true,
                    message: "rejected_swap",
                    data: response
                });
            }
        }
    } catch (err) {
        handleError(res, err, "rejected_swap error");
    }
};

export const openSwapController = {
    createOpenSwap,
    getOpenSwapList,
    proposeOpenSwap,
    cancelSwapOffer,
    acceptOpenSwap,
    getSwapPreferences,
    rejectSwapOffer,
    getMyOpenSwapList
};
