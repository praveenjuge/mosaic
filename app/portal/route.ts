import { CustomerPortal } from "@polar-sh/nextjs";

export const GET = CustomerPortal({
	accessToken: process.env.POLAR_ACCESS_TOKEN!,
	// eslint-disable-next-line unused-imports/no-unused-vars
	getCustomerId: async (req) => '<value>',
	server: "production",
});
