import {clerkClient} from "@clerk/express"


export const protect = async (req, res, next) => {
    try {
        const { userId, has } = await req.auth();

        if(!userId){
            return res.status(401).json({ message: "Unauthorized" })
        }

        const hasPremiumPlan = await has({plan: 'premium'});
        req.plan = hasPremiumPlan ? 'premium' : 'free';
        return next()
    } catch (error) {
        console.log(error);
        res.status(401).json({ message: error.code || error.message });
    }
}

// export const protectAdmin = async (req, res, next) => {
//     try {
//         const user  = await clerkClient.users.getUser(await req.auth().userId)

//        const isAdmin = process.env.ADMIN_EMAILS.split(",").includes(user.emailAddresses[0].emailAddress);

//        if(!isAdmin){
//         return res.status(401).json({ message: "Unauthorized"});
//        }
//         return next()
//     } catch (error) {
//         console.log(error);
//         res.status(401).json({ message: error.code || error.message });
//     }
// }
export const protectAdmin = async (req, res, next) => {
    try {
        // Get userId first
        const authData = await req.auth();
        const userId = authData?.userId;
        
        if(!userId){
            console.log("No userId found in request");
            return res.status(401).json({ message: "Unauthorized - Please login" });
        }

        console.log("Fetching user with ID:", userId); // Debug log

        // Fetch user from Clerk
        const user = await clerkClient.users.getUser(userId);
        
        console.log("User fetched:", user ? "Success" : "Failed"); // Debug log

        if(!user){
            console.log("User object is null/undefined");
            return res.status(401).json({ message: "User not found" });
        }

        // Check if emailAddresses exists
        if(!user.emailAddresses || user.emailAddresses.length === 0){
            console.log("No email addresses found for user");
            return res.status(401).json({ message: "User email not found" });
        }

        const userEmail = user.emailAddresses[0].emailAddress;
        const adminEmails = process.env.ADMIN_EMAILS?.split(",").map(email => email.trim()) || [];
        
        console.log("User email:", userEmail);
        console.log("Admin emails:", adminEmails);
        
        const isAdmin = adminEmails.includes(userEmail);

        if(!isAdmin){
            console.log("User is not an admin");
            return res.status(403).json({ message: "Forbidden - Admin access required" });
        }
        
        console.log("Admin access granted");
        return next();
    } catch (error) {
        console.log("protectAdmin error:", error);
        res.status(500).json({ message: error.message || "Authentication failed" });
    }
}