// models/ShoppingList.js
import mongoose from 'mongoose';

const ShoppingListSchema = new mongoose.Schema(
	{
		user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
		userEmail: String,
		item: String,
		done: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

export default mongoose.models.ShoppingList ||
	mongoose.model('ShoppingList', ShoppingListSchema);
