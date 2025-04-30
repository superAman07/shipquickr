import { NextRequest, NextResponse } from "next/server";
import { z } from 'zod';
 
const serviceabilitySchema = z.object({
  sellerPincode: z.string().length(6, { message: "Seller pincode must be 6 digits" }),
  customerPincode: z.string().length(6, { message: "Customer pincode must be 6 digits" }),
});

interface CourierService {
  courierName: string;
  serviceType: string;  
  services: {
    prepaidDelivery: boolean;
    cod: boolean;
    pickup: boolean;
    reversePickup: boolean;
    reverseDelivery: boolean;
    reverseServiceability: boolean; 
  };
}

// --- Dummy Data Function ---
// This function simulates checking serviceability. Replace its contents
// with actual API calls to courier partners later.
async function getDummyServiceability(sellerPincode: string, customerPincode: string): Promise<CourierService[]> {
  console.log(`Checking dummy serviceability for: ${sellerPincode} -> ${customerPincode}`);

  // Simulate a delay like a real API call
  await new Promise(resolve => setTimeout(resolve, 300));

  // In the future, you would make API calls here, e.g.:
  // const delhiveryData = await checkDelhiveryAPI(sellerPincode, customerPincode);
  // const bluedartData = await checkBluedartAPI(sellerPincode, customerPincode);
  // ... and combine the results.

  // For now, return hardcoded dummy data matching the image structure
  return [
    {
      courierName: "LTL Delhivery",
      serviceType: "Surface - B2B",
      services: {
        prepaidDelivery: true,
        cod: true,
        pickup: true,
        reversePickup: true,
        reverseDelivery: true,
        reverseServiceability: true,
      }
    },
    {
      courierName: "LTL MOVIN",
      serviceType: "Surface - B2B",
      services: {
        prepaidDelivery: true,
        cod: false, 
        pickup: true,
        reversePickup: true,
        reverseDelivery: true,
        reverseServiceability: true,
      }
    },
    {
      courierName: "Express Standard",
      serviceType: "Air - B2C",
      services: {
        prepaidDelivery: true,
        cod: true,
        pickup: false,  
        reversePickup: false,
        reverseDelivery: false,
        reverseServiceability: false,
      }
    }
  ];
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();

    const parsed = serviceabilitySchema.safeParse(json);
    if (!parsed.success) {
      const errorMessages = parsed.error.errors.map(err => err.message).join(', ');
      return NextResponse.json({ error: `Validation Error: ${errorMessages}` }, { status: 400 });
    }

    const { sellerPincode, customerPincode } = parsed.data;

    // --- TODO: Replace with actual API calls ---
    // Fetch serviceability data (currently using dummy data)
    const serviceabilityResults = await getDummyServiceability(sellerPincode, customerPincode);
    // --- End of section to replace ---

    if (!serviceabilityResults || serviceabilityResults.length === 0) {
      return NextResponse.json({ message: "No courier services found for the given pincodes.", services: [] }, { status: 200 });
    }

    return NextResponse.json({ services: serviceabilityResults }, { status: 200 });

  } catch (error: any) {
    console.error("Serviceability check error:", error); 
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: "Invalid request body format." }, { status: 400 });
    }
    return NextResponse.json({ error: "Something went wrong while checking serviceability." }, { status: 500 });
  }
}