import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.0/+esm';

const SUPABASE_URL = 'https://pebkryplphawjlmvcfma.supabase.co';

const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlYmtyeXBscGhhd2psbXZjZm1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2ODg2NjEsImV4cCI6MjA5NzI2NDY2MX0.Sn1IPlLKhJG5u6gTXpB_tUbSr4PThWrWVpHUNDG1zdU';

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

export async function signUp(email, password) {
    return await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: window.location.origin
        }
    });
}


export async function signIn(email, password) {
    return await supabase.auth.signInWithPassword({
        email,
        password
    });
}


export async function signInWithGoogle() {
    return await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin,
            queryParams: {
                access_type: 'offline',
                prompt: 'consent'
            }
        }
    });
}


export async function signOut() {
    return await supabase.auth.signOut();
}


export async function resetPassword(email) {
    return await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password.html`
    });
}


export async function getCurrentUser() {
    const {
        data: { user },
        error
    } = await supabase.auth.getUser();

    if (error) {
        console.error('Error getting current user:', error);
        return null;
    }

    return user;
}


export function onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
}

export async function getOrCreateClientId(userId) {
    if (!userId) {
        return null;
    }

    const { data, error } = await supabase
        .from('users')
        .select('client_id')
        .eq('id', userId)
        .single();

    if (!error && data?.client_id) {
        return data.client_id;
    }

    const clientId = `CL${userId.substring(0, 4).toUpperCase()}`;

    const { error: upsertError } = await supabase
        .from('users')
        .upsert({
            id: userId,
            client_id: clientId,
            updated_at: new Date().toISOString()
        });

    if (upsertError) {
        console.error('Error creating client ID:', upsertError);
    }

    return clientId;
}

export async function getCustomerProfile(userId = null) {
    let resolvedUserId = userId;

    if (!resolvedUserId) {
        const user = await getCurrentUser();

        if (!user) {
            return {
                data: null,
                error: new Error(
                    'User not authenticated'
                )
            };
        }

        resolvedUserId = user.id;
    }

    const { data, error } = await supabase
        .from('users')
        .select(`
            id,
            client_id,
            whatsapp_number,
            home_recipient_name,
            home_address_line_1,
            home_address_line_2,
            home_area,
            home_city,
            home_province,
            home_postal_code,
            delivery_recipient_name,
            delivery_phone,
            delivery_address_line_1,
            delivery_address_line_2,
            delivery_area,
            delivery_city,
            delivery_province,
            delivery_postal_code,
            delivery_instructions
        `)
        .eq('id', resolvedUserId)
        .maybeSingle();

    if (error) {
        console.error(
            'Error loading customer profile:',
            error
        );
    }

    return {
        data,
        error
    };
}


export async function saveCustomerProfile(
    profileDetails,
    userId = null
) {
    let resolvedUserId = userId;

    if (!resolvedUserId) {
        const user = await getCurrentUser();

        if (!user) {
            return {
                data: null,
                error: new Error(
                    'User not authenticated'
                )
            };
        }

        resolvedUserId = user.id;
    }

    const cleanText = value => {
        const text = String(value ?? '').trim();

        return text || null;
    };

    const profileRecord = {
        id: resolvedUserId,

        whatsapp_number: cleanText(
            profileDetails.whatsapp_number
        ),

        home_recipient_name: cleanText(
            profileDetails.home_recipient_name
        ),

        home_address_line_1: cleanText(
            profileDetails.home_address_line_1
        ),

        home_address_line_2: cleanText(
            profileDetails.home_address_line_2
        ),

        home_area: cleanText(
            profileDetails.home_area
        ),

        home_city: cleanText(
            profileDetails.home_city
        ),

        home_province: cleanText(
            profileDetails.home_province
        ),

        home_postal_code: cleanText(
            profileDetails.home_postal_code
        ),

        delivery_recipient_name: cleanText(
            profileDetails.delivery_recipient_name
        ),

        delivery_phone: cleanText(
            profileDetails.delivery_phone
        ),

        delivery_address_line_1: cleanText(
            profileDetails.delivery_address_line_1
        ),

        delivery_address_line_2: cleanText(
            profileDetails.delivery_address_line_2
        ),

        delivery_area: cleanText(
            profileDetails.delivery_area
        ),

        delivery_city: cleanText(
            profileDetails.delivery_city
        ),

        delivery_province: cleanText(
            profileDetails.delivery_province
        ),

        delivery_postal_code: cleanText(
            profileDetails.delivery_postal_code
        ),

        delivery_instructions: cleanText(
            profileDetails.delivery_instructions
        ),

        updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('users')
        .upsert(
            profileRecord,
            {
                onConflict: 'id'
            }
        )
        .select()
        .single();

    if (error) {
        console.error(
            'Error saving customer profile:',
            error
        );
    }

    return {
        data,
        error
    };
}

export async function getServices() {

    const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("active", true)
        .order("display_order", {
            ascending: true
        });

    if (error) {
        console.error("Error loading services:", error);
        return [];
    }

    return data ?? [];
}


export async function searchServices(searchTerm) {
    const term = String(searchTerm || '').trim();

    if (!term) {
        return getServices();
    }

    const safeTerm = term
        .replace(/[%_]/g, '')
        .replace(/,/g, ' ')
        .trim();

    if (!safeTerm) {
        return [];
    }

    const { data, error } = await supabase
        .from('services')
        .select('id')
        .eq('active', true)
        .or(
            [
                `title.ilike.%${safeTerm}%`,
                `description.ilike.%${safeTerm}%`,
                `category.ilike.%${safeTerm}%`,
                `slug.ilike.%${safeTerm}%`
            ].join(',')
        )
        .order('display_order', {
            ascending: true
        });

    if (error) {
        console.error('Search error:', error);
        throw error;
    }

    return data || [];
}

const SKETCH_BUCKET = 'order-sketches';

const ALLOWED_SKETCH_TYPES = [
    'image/png',
    'image/jpeg',
    'application/pdf'
];

const MAX_SKETCH_SIZE = 5 * 1024 * 1024;


function cleanSketchFileName(fileName) {
    const extension =
        String(fileName)
            .split('.')
            .pop()
            ?.toLowerCase() || 'file';

    const baseName =
        String(fileName)
            .replace(/\.[^/.]+$/, '')
            .replace(/[^a-zA-Z0-9_-]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 60) || 'sketch';

    return `${baseName}.${extension}`;
}


export function validateSketchFile(file) {
    if (!file) {
        return null;
    }

    if (!ALLOWED_SKETCH_TYPES.includes(file.type)) {
        return new Error(
            'Only PNG, JPG, JPEG and PDF files are allowed.'
        );
    }

    if (file.size > MAX_SKETCH_SIZE) {
        return new Error(
            'The sketch file must not be larger than 5 MB.'
        );
    }

    return null;
}


export async function uploadOrderSketch({
    file,
    orderDatabaseId,
    orderNumber,
    userId
}) {
    if (!file) {
        return {
            data: null,
            error: null
        };
    }

    const validationError =
        validateSketchFile(file);

    if (validationError) {
        return {
            data: null,
            error: validationError
        };
    }

    if (
        !orderDatabaseId ||
        !orderNumber ||
        !userId
    ) {
        return {
            data: null,
            error: new Error(
                'Missing order information for sketch upload.'
            )
        };
    }

    const safeFileName =
        cleanSketchFileName(file.name);

    const uniqueName =
        `${Date.now()}-${crypto.randomUUID()}-${safeFileName}`;

    const storagePath =
        `${userId}/${orderNumber}/${uniqueName}`;

    const {
        error: uploadError
    } = await supabase.storage
        .from(SKETCH_BUCKET)
        .upload(
            storagePath,
            file,
            {
                cacheControl: '3600',
                upsert: false,
                contentType:
                    file.type || undefined
            }
        );

    if (uploadError) {
        console.error(
            'Sketch storage upload failed:',
            uploadError
        );

        return {
            data: null,
            error: uploadError
        };
    }

    const expiresAt = new Date(
        Date.now() +
        5 * 24 * 60 * 60 * 1000
    ).toISOString();

    const {
        data,
        error: recordError
    } = await supabase
        .from('order_sketches')
        .insert({
            order_id:
                orderDatabaseId,

            user_id:
                userId,

            storage_path:
                storagePath,

            file_name:
                file.name,

            mime_type:
                file.type || null,

            size_bytes:
                file.size,

            expires_at:
                expiresAt
        })
        .select()
        .single();

    if (recordError) {
        console.error(
            'Sketch metadata insert failed:',
            recordError
        );

        await supabase.storage
            .from(SKETCH_BUCKET)
            .remove([storagePath]);

        return {
            data: null,
            error: recordError
        };
    }

    return {
        data,
        error: null
    };
}

export async function saveOrder(orderData) {
    const user = await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                'User not authenticated'
            )
        };
    }

    const clientId = await getOrCreateClientId(
        user.id
    );

    const customerDetails =
        orderData.customerDetails || {};

    const homeAddress =
        orderData.homeAddress || {};

    const deliveryAddress =
        orderData.deliveryAddress || {};

    const { data, error } = await supabase
        .from('orders')
        .insert({
            order_id: orderData.order_id,

            user_id: user.id,
            client_id: clientId,

            cart: orderData.cart,
            user_input: orderData.userInput,
            totals: orderData.totals,

            customer_details: customerDetails,
            home_address: homeAddress,

            printing_requested:
                orderData.printingRequested === true,

            delivery_address:
                orderData.printingRequested === true
                    ? deliveryAddress
                    : {},

            payment_status:
                orderData.paymentStatus || 'Pending',

            design_status:
                orderData.designStatus || 'Waiting',

            progress:
                Number(orderData.progress || 0),

            created_at:
                orderData.created_at ||
                new Date().toISOString(),

            updated_at:
                orderData.updated_at ||
                new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        console.error(
            'Error saving order:',
            error
        );
    }

    return {
        data,
        error
    };
}


export async function getUserOrders(userId) {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', {
            ascending: false
        });

    return {
        data,
        error
    };
}

export async function createOzowPayment(
    orderId,
    amount,
    description,
    email,
    clientId
) {
    try {
        console.log('Creating secure Ozow payment:', orderId);

        if (!orderId) {
            throw new Error('Order ID is required.');
        }

        const numericAmount = Number(amount);

        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            throw new Error('A valid payment amount is required.');
        }

        if (!email || !email.includes('@')) {
            throw new Error('A valid customer email address is required.');
        }

        const {
            data: { session },
            error: sessionError
        } = await supabase.auth.getSession();

        if (sessionError) {
            console.error('Session error:', sessionError);
            throw new Error('Unable to verify your login session.');
        }

        if (!session?.access_token) {
            throw new Error(
                'You must be signed in before starting payment.'
            );
        }

        const { data, error } = await supabase.functions.invoke(
            'create-ozow-payment',
            {
                body: {
                    orderId: String(orderId),
                    amount: numericAmount,
                    description:
                        description || 'Design Services',
                    email: String(email).trim(),
                    clientId: clientId
                        ? String(clientId)
                        : ''
                }
            }
        );

        if (error) {
            console.error('Ozow Edge Function error:', error);

            let message =
                error.message ||
                'Unable to create the Ozow payment request.';

            if (error.context) {
                try {
                    const responseBody =
                        await error.context.json();

                    if (responseBody?.error) {
                        message = responseBody.error;
                    }
                } catch (responseReadError) {
                    console.error(
                        'Could not read function error response:',
                        responseReadError
                    );
                }
            }

            throw new Error(message);
        }

        if (!data) {
            throw new Error(
                'The payment server returned an empty response.'
            );
        }

        if (data.success === false) {
            throw new Error(
                data.error ||
                'The payment server rejected the request.'
            );
        }

        if (!data.paymentUrl) {
            throw new Error(
                'The payment response does not contain an Ozow payment URL.'
            );
        }

        if (!data.params || typeof data.params !== 'object') {
            throw new Error(
                'The payment response does not contain the required Ozow fields.'
            );
        }

        if (!data.params.HashCheck) {
            throw new Error(
                'The payment response does not contain a HashCheck.'
            );
        }

        console.log(
            'Ozow payment request created successfully:',
            data.transactionReference
        );

        return {
            success: true,
            paymentUrl: data.paymentUrl,
            params: data.params,
            transactionReference:
                data.transactionReference || null,
            bankReference:
                data.bankReference || null
        };
    } catch (error) {
        console.error('Error creating Ozow payment:', error);
        throw error;
    }
}

export async function checkPaymentStatus(orderId) {
    try {
        if (!orderId) {
            return null;
        }

        console.log(
            'Checking payment status for order:',
            orderId
        );

        const { data, error } = await supabase
            .from('payment_transactions')
            .select('*')
            .eq('order_id', orderId)
            .order('created_at', {
                ascending: false
            })
            .limit(1);

        if (error) {
            console.error(
                'Error checking payment status:',
                error
            );

            return null;
        }

        if (!data || data.length === 0) {
            console.log(
                'No payment transaction found for order:',
                orderId
            );

            return null;
        }

        console.log(
            'Payment status:',
            data[0].status
        );

        return data[0];
    } catch (error) {
        console.error(
            'Error in checkPaymentStatus:',
            error
        );

        return null;
    }
}


export async function updateOrderPaymentStatus(
    orderId,
    status
) {
    try {
        if (!orderId) {
            throw new Error('Order ID is required.');
        }

        if (!status) {
            throw new Error('Payment status is required.');
        }

        const { data, error } = await supabase
            .from('orders')
            .update({
                payment_status: status,
                updated_at: new Date().toISOString()
            })
            .eq('order_id', orderId)
            .select()
            .single();

        if (error) {
            console.error(
                'Error updating order status:',
                error
            );

            return {
                data: null,
                error
            };
        }

        console.log(
            'Order payment status updated:',
            status
        );

        return {
            data,
            error: null
        };
    } catch (error) {
        console.error(
            'Error in updateOrderPaymentStatus:',
            error
        );

        return {
            data: null,
            error
        };
    }
}