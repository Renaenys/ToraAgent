import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
	{
		name: String,
		email: { type: String, required: true, unique: true },
		accessToken: String,
		refreshToken: String,
		image: String,
		membership: {
			type: String,
			enum: ['None', 'TRAIL', 'VIP', 'VIP2'],
			default: 'None',
		},
		expireDate: {
			type: Date,
			default: null,
		},
	},
	{ timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);
