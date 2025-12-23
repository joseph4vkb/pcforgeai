import {
  createCallerFactory,
  createTRPCRouter,
} from "~/server/trpc/main";
import { login } from "~/server/trpc/procedures/login";
import { getFeaturedBuilds } from "~/server/trpc/procedures/getFeaturedBuilds";
import { getBuildById } from "~/server/trpc/procedures/getBuildById";
import { saveBuild } from "~/server/trpc/procedures/saveBuild";
import { getAllBuilds } from "~/server/trpc/procedures/getAllBuilds";
import { updateBuild } from "~/server/trpc/procedures/updateBuild";
import { deleteBuild } from "~/server/trpc/procedures/deleteBuild";
import { getAdminConfig } from "~/server/trpc/procedures/getAdminConfig";
import { updateAdminConfig } from "~/server/trpc/procedures/updateAdminConfig";
import { generatePcBuild } from "~/server/trpc/procedures/generatePcBuild";
import { generateProductCatalog } from "~/server/trpc/procedures/generateProductCatalog";
import { getAmazonAffiliateId } from "~/server/trpc/procedures/getAmazonAffiliateId";
import { registerUser } from "~/server/trpc/procedures/registerUser";
import { saveUserBuild } from "~/server/trpc/procedures/saveUserBuild";
import { getSavedBuilds } from "~/server/trpc/procedures/getSavedBuilds";
import { getAmazonProducts } from "~/server/trpc/procedures/getAmazonProducts";
import { getLaptops } from "~/server/trpc/procedures/getLaptops";
import { getMonitors } from "~/server/trpc/procedures/getMonitors";
import { getHeadsets } from "~/server/trpc/procedures/getHeadsets";
import { getMiniPcs } from "~/server/trpc/procedures/getMiniPcs";
import { updateAdminPassword } from "~/server/trpc/procedures/updateAdminPassword";
import { getFilteredBuilds } from "~/server/trpc/procedures/getFilteredBuilds";
import { verifyEmail } from "~/server/trpc/procedures/verifyEmail";
import { requestVerificationEmail } from "~/server/trpc/procedures/requestVerificationEmail";
import { forgotPassword } from "~/server/trpc/procedures/forgotPassword";
import { resetPassword } from "~/server/trpc/procedures/resetPassword";
import { sendTestEmail } from "~/server/trpc/procedures/sendTestEmail";
import { recordClick } from "~/server/trpc/procedures/recordClick";
import { getBuildAnalytics } from "~/server/trpc/procedures/getBuildAnalytics";
import { getLaptopAnalytics } from "~/server/trpc/procedures/getLaptopAnalytics";
import { getAllAccounts } from "~/server/trpc/procedures/getAllAccounts";
import { updateUserRole } from "~/server/trpc/procedures/updateUserRole";
import { getPaginatedSavedBuilds } from "~/server/trpc/procedures/getPaginatedSavedBuilds";
import { generateBlogContent } from "~/server/trpc/procedures/generateBlogContent";
import { createBlogPost } from "~/server/trpc/procedures/createBlogPost";
import { updateBlogPost } from "~/server/trpc/procedures/updateBlogPost";
import { deleteBlogPost } from "~/server/trpc/procedures/deleteBlogPost";
import { getAdminBlogs } from "~/server/trpc/procedures/getAdminBlogs";
import { getPublishedBlogs } from "~/server/trpc/procedures/getPublishedBlogs";
import { getHomepageBlogs } from "~/server/trpc/procedures/getHomepageBlogs";
import { getBlogBySlug } from "~/server/trpc/procedures/getBlogBySlug";
import { getBlogCategories } from "~/server/trpc/procedures/getBlogCategories";
import { getRelatedBlogPosts } from "~/server/trpc/procedures/getRelatedBlogPosts";
import { getMinioPresignedUrl } from "~/server/trpc/procedures/getMinioPresignedUrl";
import { createBannerAd } from "~/server/trpc/procedures/createBannerAd";
import { listBannerAds } from "~/server/trpc/procedures/listBannerAds";
import { getBannerAdById } from "~/server/trpc/procedures/getBannerAdById";
import { updateBannerAd } from "~/server/trpc/procedures/updateBannerAd";
import { deleteBannerAd } from "~/server/trpc/procedures/deleteBannerAd";
import { getActiveBanners } from "~/server/trpc/procedures/getActiveBanners";
import { logAdClick } from "~/server/trpc/procedures/logAdClick";

export const appRouter = createTRPCRouter({
  login,
  getFeaturedBuilds,
  getBuildById,
  saveBuild,
  getAllBuilds,
  updateBuild,
  deleteBuild,
  getAdminConfig,
  updateAdminConfig,
  generatePcBuild,
  generateProductCatalog,
  getAmazonAffiliateId,
  registerUser,
  saveUserBuild,
  getSavedBuilds,
  getAmazonProducts,
  getLaptops,
  getMonitors,
  getHeadsets,
  getMiniPcs,
  updateAdminPassword,
  getFilteredBuilds,
  verifyEmail,
  requestVerificationEmail,
  forgotPassword,
  resetPassword,
  sendTestEmail,
  recordClick,
  getBuildAnalytics,
  getLaptopAnalytics,
  getAllAccounts,
  updateUserRole,
  getPaginatedSavedBuilds,
  getMinioPresignedUrl,
  // Blog procedures
  generateBlogContent,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  getAdminBlogs,
  getPublishedBlogs,
  getHomepageBlogs,
  getBlogBySlug,
  getBlogCategories,
  getRelatedBlogPosts,
  // Banner ad procedures
  createBannerAd,
  listBannerAds,
  getBannerAdById,
  updateBannerAd,
  deleteBannerAd,
  getActiveBanners,
  logAdClick,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
