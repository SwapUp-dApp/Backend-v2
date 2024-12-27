import db from "../../database/models";
import { tryParseJSON } from "./helpers";

export const getFormattedUserDetails = (userData) => {
  return ({
    ...userData,
    images: tryParseJSON(userData.images),
    social_links: tryParseJSON(userData.social_links),
    tags: tryParseJSON(userData.tags),
    points: tryParseJSON(userData.points)
  });
};


export const updateUserPointsByWallet = async (walletId, pointsToAdd, keyType, defaultPointSystem) => {
  // Fetch the user by walletId
  const user = await db.users.findOne({ where: { wallet: walletId } });

  if (!user) {
    throw new Error(`User with wallet ID ${walletId} not found.`);
  }

  // Parse the user's points object from the database
  let userPoints = tryParseJSON(user.points);

  // Ensure the points structure exists, initialize if not
  if (!userPoints || typeof userPoints !== 'object') {
    userPoints = defaultPointSystem; // Initialize with 0 if the structure is missing
  }

  // Update the points for the specific keyType
  userPoints[keyType] = (userPoints[keyType] || 0) + pointsToAdd;

  // Update the total points
  userPoints.total = Object.keys(userPoints)
    .filter(key => key !== 'total') // Exclude 'total' key from summing
    .reduce((sum, key) => sum + userPoints[key], 0);

  // Save the updated points back to the user record
  user.points = JSON.stringify(userPoints);
  await user.save();

  return userPoints;
};