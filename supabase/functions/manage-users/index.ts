import { createClient } from 'npm:@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteUserRequest {
  action: 'delete';
  userId: string;
}

interface ResetPasswordRequest {
  action: 'reset-password';
  userId: string;
  newPassword: string;
}

type RequestBody = DeleteUserRequest | ResetPasswordRequest;

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the user is authenticated and is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('ไม่พบข้อมูลการยืนยันตัวตน');
    }

    // Create regular client to verify user
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('ไม่สามารถยืนยันตัวตนได้');
    }

    // Check if user is admin
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError) {
      console.error('Error checking roles:', rolesError);
      throw new Error('ไม่สามารถตรวจสอบสิทธิ์ได้');
    }

    console.log('User ID:', user.id);
    console.log('User roles:', roles);

    const isAdmin = roles?.some((r) => r.role === 'แอดมิน');
    console.log('Is admin:', isAdmin);
    
    if (!isAdmin) {
      throw new Error('คุณต้องเป็นแอดมินเท่านั้นถึงจะสามารถดำเนินการได้');
    }

    // Parse request body
    const body: RequestBody = await req.json();

    // Handle different actions
    if (body.action === 'delete') {
      console.log(`Deleting user: ${body.userId}`);
      
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
        body.userId
      );

      if (deleteError) {
        console.error('Error deleting user:', deleteError);
        throw new Error(`ลบผู้ใช้ไม่สำเร็จ: ${deleteError.message}`);
      }

      console.log(`User deleted successfully: ${body.userId}`);

      return new Response(
        JSON.stringify({ success: true, message: 'ลบผู้ใช้เรียบร้อยแล้ว' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else if (body.action === 'reset-password') {
      console.log(`Resetting password for user: ${body.userId}`);

      if (!body.newPassword || body.newPassword.length < 6) {
        throw new Error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      }

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        body.userId,
        { password: body.newPassword }
      );

      if (updateError) {
        console.error('Error resetting password:', updateError);
        throw new Error(`รีเซ็ตรหัสผ่านไม่สำเร็จ: ${updateError.message}`);
      }

      console.log(`Password reset successfully for user: ${body.userId}`);

      return new Response(
        JSON.stringify({ success: true, message: 'รีเซ็ตรหัสผ่านเรียบร้อยแล้ว' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else {
      throw new Error('ไม่รองรับการดำเนินการนี้');
    }
  } catch (error) {
    console.error('Error in manage-users function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
