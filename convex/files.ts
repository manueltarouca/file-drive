import { MutationCtx, QueryCtx, mutation, query } from './_generated/server';
import { ConvexError, v } from 'convex/values';
import { getUser } from './users';

async function hasAccessToOrg(ctx: QueryCtx | MutationCtx, tokenIdentifier: string, orgId: string) {
  const user = await getUser(ctx, tokenIdentifier);
  return user.orgIds.includes(orgId) || user.tokenIdentifier.includes(orgId);
}

export const createFile = mutation({
  args: {
    name: v.string(),
    orgId: v.string(),
  },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError('You must be signed in to create a file');
    }
    const hasAccess = await hasAccessToOrg(ctx, identity.tokenIdentifier, args.orgId);
    console.log(identity.tokenIdentifier, args.orgId);
    console.log('hasAccess', hasAccess);
    if (!hasAccess) {
      throw new ConvexError('You do not have access to this organization');
    }
    await ctx.db.insert('files', {
      name: args.name,
      orgId: args.orgId,
    });
  },
});

export const getFiles = query({
  args: { orgId: v.string() },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const hasAccess = await hasAccessToOrg(ctx, identity.tokenIdentifier, args.orgId);
    if (!hasAccess) {
      return [];
    }
    return ctx.db
      .query('files')
      .withIndex('by_orgId', (q) => q.eq('orgId', args.orgId))
      .collect();
  },
});
