export const MOCK_USER_ID = '00000000-0000-0000-0000-000000000000';

export const getMockUserId = (): string => {
  return MOCK_USER_ID;
};

export const initializeMockUser = async (supabase: any, walletAddress: string) => {
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', walletAddress)
    .maybeSingle();

  if (!existingUser) {
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          id: MOCK_USER_ID,
          wallet_address: walletAddress,
          username: 'DaftUser'
        }
      ])
      .select()
      .single();

    if (error && error.code !== '23505') {
      console.error('Error creating mock user:', error);
    }

    return data || { id: MOCK_USER_ID, wallet_address: walletAddress };
  }

  return existingUser;
};
