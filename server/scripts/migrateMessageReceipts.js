import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";

const BATCH_SIZE = 500;

const toIdStrings = (ids = []) =>
  ids
    .map((id) => id?.toString())
    .filter((id) => typeof id === "string" && id.length > 0);

const uniqueStrings = (ids) => Array.from(new Set(ids));

const equalStringSets = (left, right) => {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((value) => rightSet.has(value));
};

const toObjectIds = (ids) => ids.map((id) => new mongoose.Types.ObjectId(id));

const run = async () => {
  await connectDB();

  const conversationParticipants = new Map();
  const query = {
    $or: [
      { deliveredTo: { $exists: false } },
      { seenBy: { $exists: false } },
      { status: { $exists: true } },
    ],
  };

  let scanned = 0;
  let updated = 0;
  let bulkOps = [];

  const flushBulk = async () => {
    if (!bulkOps.length) return;
    const result = await Message.bulkWrite(bulkOps, { ordered: false });
    updated += result.modifiedCount || 0;
    bulkOps = [];
  };

  const cursor = Message.find(query)
    .select("_id senderId conversationId status deliveredTo seenBy")
    .lean()
    .cursor();

  for await (const message of cursor) {
    scanned += 1;
    const conversationId = message.conversationId.toString();

    let participants = conversationParticipants.get(conversationId);
    if (!participants) {
      const conversation = await Conversation.findById(conversationId)
        .select("participants")
        .lean();
      participants = toIdStrings(conversation?.participants || []);
      conversationParticipants.set(conversationId, participants);
    }

    const senderId = message.senderId.toString();
    let nextDeliveredTo = uniqueStrings([
      ...toIdStrings(message.deliveredTo || []),
      senderId,
    ]);
    let nextSeenBy = uniqueStrings([
      ...toIdStrings(message.seenBy || []),
      senderId,
    ]);

    if (message.status === "delivered" || message.status === "read") {
      nextDeliveredTo = uniqueStrings([...nextDeliveredTo, ...participants]);
    }

    if (message.status === "read") {
      nextSeenBy = uniqueStrings([...nextSeenBy, ...participants]);
    }

    const currentDeliveredTo = uniqueStrings(toIdStrings(message.deliveredTo || []));
    const currentSeenBy = uniqueStrings(toIdStrings(message.seenBy || []));

    const shouldWrite =
      !equalStringSets(currentDeliveredTo, nextDeliveredTo) ||
      !equalStringSets(currentSeenBy, nextSeenBy) ||
      typeof message.status !== "undefined";

    if (!shouldWrite) {
      continue;
    }

    bulkOps.push({
      updateOne: {
        filter: { _id: message._id },
        update: {
          $set: {
            deliveredTo: toObjectIds(nextDeliveredTo),
            seenBy: toObjectIds(nextSeenBy),
          },
          $unset: { status: "" },
        },
      },
    });

    if (bulkOps.length >= BATCH_SIZE) {
      await flushBulk();
    }
  }

  await flushBulk();

  console.log(
    `Message receipts migration completed. Scanned: ${scanned}, Updated: ${updated}`,
  );
};

run()
  .then(async () => {
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Message receipts migration failed:", error);
    await mongoose.connection.close();
    process.exit(1);
  });
