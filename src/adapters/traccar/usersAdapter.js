import fetchOrThrow from '../../common/util/fetchOrThrow';

/**
 * Adapter para abstrair a comunicação com entidades de Usuários baseadas no Traccar.
 */
export const traccarUsersAdapter = {
  /**
   * Atualiza dados do usuário (ex: aceitar termos).
   */
  updateUser: async (user) => {
    const response = await fetchOrThrow(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    return response.json();
  },
};
