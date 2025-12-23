# Amazon Product Advertising API Integration

## Overview

The Amazon Product Advertising API (PA API) integration provides comprehensive product data management for the PC Builder platform. This integration enables:

1. **Automatic Product Updates**: Keep prices, names, and availability current across all PC builds
2. **Product Browsing**: A dedicated Products page for users to browse PC components
3. **Affiliate Link Management**: Proper affiliate tracking with DetailPageURL from Amazon
4. **Image Integration**: Product images displayed throughout the platform
5. **Real-time Data**: Live product information directly from Amazon India

## Features

### 1. Automatic Product Updates (Admin)

- **Bulk Processing**: Update all products across all PC builds in one operation
- **Detailed Error Reporting**: See exactly which products succeeded or failed
- **Smart Fallbacks**: Preserves original data if updates fail
- **Rate Limiting**: Complies with Amazon's 1 request/second limit

### 2. Products Page (Public)

- **Category Filtering**: Browse by CPU, GPU, Motherboard, RAM, Storage, PSU, Case, Cooler
- **Price Range Filtering**: Set minimum and maximum price filters
- **Search Functionality**: Search for specific products by name
- **Pagination**: Load more products as needed
- **Product Images**: Full product images from Amazon
- **Direct Purchase Links**: Working affiliate links to Amazon India

### 3. Enhanced Build Pages

- **Product Images**: Display product images in build details
- **Verified Links**: Use DetailPageURL from PA API for accurate affiliate tracking
- **Fallback URLs**: Automatic fallback to constructed URLs if PA API URL unavailable
- **Real-time Pricing**: Current prices pulled from Amazon

## Prerequisites

To use this feature, you need:

1. **Amazon Associates Account**: For earning affiliate commissions
2. **Product Advertising API Credentials**: Access Key and Secret Key
3. **API Approval**: Your Associates account must be approved for PA API access

## Getting Amazon PA API Credentials

### Step 1: Sign up for Amazon Associates

1. Visit [Amazon Associates India](https://affiliate.amazon.in/)
2. Sign up or log in with your Amazon account
3. Complete the registration process including:
   - Website/app information
   - Payment details
   - Tax information
4. Note your **Associate Tag** (e.g., `eknowledgetre-21`)

### Step 2: Apply for Product Advertising API Access

1. Log in to [Amazon Associates Central](https://affiliate.amazon.in/)
2. Navigate to **Tools** → **Product Advertising API**
3. Apply for API access
4. Wait for approval (typically 1-2 business days)
5. Once approved, you'll receive:
   - **Access Key** (20 characters, e.g., `AKIAIOSFODNN7EXAMPLE`)
   - **Secret Key** (40 characters, e.g., `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`)

**Important**: Keep these credentials secure. Never commit them to version control.

## Configuration

### 1. Access Admin Dashboard

1. Navigate to `/admin/login`
2. Log in with your admin credentials
3. Click on the **Settings** tab

### 2. Configure API Credentials

In the Amazon Product Advertising API section, fill in:

- **Amazon Affiliate ID**: Your Amazon Associates tag (e.g., `eknowledgetre-21`)
- **PA API Access Key**: Your 20-character access key
- **PA API Secret Key**: Your 40-character secret key

Click **Save Configuration** to store the credentials.

### 3. Pull Amazon Products

Once configured, click the **Pull Amazon Products** button.

The system will:
1. Validate your credentials
2. Fetch all PC builds from the database
3. Query Amazon PA API for each product's ASIN
4. Update product names, prices, URLs, and images
5. Recalculate total costs for each build
6. Display detailed results:
   - Number of products updated successfully
   - Number of builds processed
   - Any errors encountered with specific details

**Expected Duration**: 1-5 minutes depending on the number of products (1 request/second rate limit)

## How It Works

### Technical Architecture

#### 1. Core Utilities (`src/server/utils/amazon-pa-api.ts`)

**`fetchAmazonProductData(asin, credentials)`**
- Queries Amazon PA API using the GetItems operation
- Requests the following resources:
  - `ItemInfo.Title` - Product name
  - `Offers.Listings.Price` - Current price
  - `DetailPageURL` - Proper affiliate link
  - `Images.Primary.Medium` - Product image (300x300px)
  - `ItemInfo.ProductInfo` - Additional product details
- Returns: `{ name, price, url, imageUrl }` or `null` if not found

**`updatePartsWithAmazonData(parts, credentials)`**
- Processes an array of parts
- Skips placeholder ASINs (`INTEGRATED`, `STOCK`)
- Implements 1-second delay between requests
- Preserves original data on failure

#### 2. Admin Procedures

**`pullAmazonProducts` (Mutation)**
- Requires admin authentication via JWT token
- Validates PA API credentials are configured
- Processes all builds in the database
- Returns detailed results:
  ```typescript
  {
    success: boolean,
    updatedCount: number,
    errorCount: number,
    totalBuilds: number,
    errors?: string[]  // Detailed error messages
  }
  ```

#### 3. Public Procedures

**`getAmazonProducts` (Query)**
- Accepts filters: `category`, `minPrice`, `maxPrice`, `searchQuery`, `page`
- Uses SearchItems operation to find products
- Returns paginated results with:
  - Product array (ASIN, name, price, imageUrl, url, category)
  - `hasMore` flag for pagination
  - `totalResults` count
  - Optional `error` message

#### 4. Frontend Components

**Products Page (`/products/`)**
- FilterSidebar: Category, price range, and search filters
- ProductCard: Individual product display with image and CTA
- Pagination: Load more functionality
- Error states: Handles API failures gracefully

**Build Pages**
- `getAmazonUrl()` function prioritizes PA API URL over constructed URL
- Displays product images when available
- Fallback to placeholder for missing images

### Data Flow

1. **Admin Updates Products**:
   ```
   Admin Dashboard → pullAmazonProducts mutation → PA API GetItems
   → Update database → Invalidate queries → UI refresh
   ```

2. **Users Browse Products**:
   ```
   Products Page → getAmazonProducts query → PA API SearchItems
   → Filter/format results → Display products
   ```

3. **Users View Builds**:
   ```
   Build Page → Load from database → Display with PA API data
   → Click "Buy on Amazon" → Navigate to DetailPageURL
   ```

### Database Schema

Products are stored in the `PcBuild.parts` JSON field:

```typescript
{
  category: string,      // "CPU", "GPU", etc.
  name: string,          // From PA API: ItemInfo.Title
  asin: string,          // Amazon Standard Identification Number
  price: number,         // From PA API: Offers.Listings.Price (in INR)
  specs: object,         // Component specifications
  url?: string,          // From PA API: DetailPageURL
  imageUrl?: string      // From PA API: Images.Primary.Medium.URL
}
```

### API Configuration

**Region**: `eu-west-1` (Amazon India)
**Host**: `webservices.amazon.in`
**Partner Type**: `Associates`
**Search Index**: `Electronics`

## Error Handling

### Common Errors and Solutions

#### 1. "Amazon PA API credentials not configured"

**Cause**: Missing Access Key or Secret Key in admin settings

**Solution**:
1. Go to Admin Dashboard → Settings
2. Fill in both PA API Access Key and Secret Key
3. Click Save Configuration
4. Retry the operation

#### 2. "Failed to pull Amazon products"

**Possible Causes**:
- Invalid or expired credentials
- API rate limiting exceeded
- Network connectivity issues
- Invalid ASINs in database

**Solution**:
1. Check the detailed error messages in the toast notification
2. Verify credentials are correct (re-enter if needed)
3. Check server logs for specific API errors
4. Wait a few minutes if rate limited, then retry

#### 3. "Some builds failed to update"

**This is normal behavior**. The system continues processing even if some products fail.

**Common reasons for individual failures**:
- ASIN not available on Amazon India
- Product discontinued or out of stock
- Temporary API errors
- Invalid ASIN format

**What to do**:
- Review the error details in the toast message
- Original product data is preserved
- Products can be manually updated in the database if needed

#### 4. Products Page shows "Failed to Load Products"

**Possible Causes**:
- PA API credentials not configured
- Invalid search query
- API quota exceeded

**Solution**:
1. Ensure admin has configured PA API credentials
2. Try a different category or search term
3. Check if error message provides specific details
4. Wait and retry if quota exceeded

### Error Message Examples

**Success**:
```
✓ Successfully updated 156 products across 12 builds!
```

**Partial Failure**:
```
⚠ Updated 142 products, but 2 builds failed.
Errors encountered:
Build 5: ASIN B0C1234XYZ not found
Build 8: Rate limit exceeded
```

**Complete Failure**:
```
✗ Failed to pull Amazon products.
Amazon PA API credentials not configured. Please set them in admin settings.
```

## URL Format and Affiliate Tracking

### DetailPageURL (Preferred)

The PA API returns `DetailPageURL` which includes:
- Proper affiliate tag
- Amazon's tracking parameters
- Optimized for conversion

Example:
```
https://www.amazon.in/dp/B0C1234XYZ?tag=eknowledgetre-21&linkCode=...
```

### Fallback URL Construction

If `DetailPageURL` is unavailable:
```
https://www.amazon.in/dp/{ASIN}?tag={affiliateId}
```

### Link Validation

All CTA buttons use the `getAmazonUrl()` function which:
1. Checks if `part.url` exists (from PA API)
2. Uses PA API URL if available
3. Falls back to constructed URL
4. Always includes affiliate tag

## Best Practices

### For Administrators

1. **Initial Setup**:
   - Configure all three credentials (Affiliate ID, Access Key, Secret Key)
   - Test with "Pull Amazon Products" button
   - Verify success message shows updated products

2. **Regular Maintenance**:
   - Run product pull weekly to keep prices current
   - Schedule during low-traffic hours (2-5 AM IST)
   - Monitor error messages for patterns
   - Update credentials if they expire

3. **Monitoring**:
   - Check build pages after updates to verify accuracy
   - Review featured builds for correct pricing
   - Test affiliate links periodically

### For Users

1. **Product Browsing**:
   - Use category filters to narrow results
   - Set price ranges for budget-focused searches
   - Search by specific model numbers for exact matches

2. **Build Creation**:
   - Generated builds include current prices
   - Product images help verify components
   - All links are affiliate-tracked for commission

## API Limits and Quotas

### Amazon PA API Limits

- **Rate Limit**: 1 request per second (enforced by our implementation)
- **Daily Quota**: Varies based on Associates account performance
  - New accounts: ~8,640 requests/day (1/sec for 24 hours)
  - Established accounts: Higher limits based on revenue
- **Throttling**: Temporary blocks if limits exceeded

### Our Implementation

- **Automatic Rate Limiting**: 1-second delay between requests
- **Error Recovery**: Continues processing despite individual failures
- **Quota Management**: Displays clear errors when quota exceeded

## Security

### Credential Protection

- **Storage**: Encrypted in PostgreSQL database
- **Access**: Only admin-authenticated requests can use credentials
- **Transmission**: Never sent to frontend/client
- **Logging**: Credentials never logged in plaintext

### Authentication Flow

```
Admin Login → JWT Token → Verify Role → Access Credentials → Call PA API
```

### Best Practices

1. Use strong, unique credentials
2. Rotate credentials periodically
3. Monitor for unauthorized access in Amazon Associates dashboard
4. Never commit credentials to version control
5. Use environment variables for sensitive data in production

## Troubleshooting Guide

### Diagnostic Steps

1. **Check Configuration**:
   ```
   Admin Dashboard → Settings → Verify all three fields filled
   ```

2. **Test Credentials**:
   ```
   Click "Pull Amazon Products" → Check toast message
   ```

3. **Review Server Logs**:
   ```
   Look for "Error fetching data for ASIN" messages
   Check for specific error codes (INVALID_CREDENTIALS, THROTTLED, etc.)
   ```

4. **Verify ASINs**:
   ```
   Check database for valid ASIN format (10 characters)
   Ensure ASINs are for Amazon India (.in domain)
   ```

### Getting Help

**For Amazon-related issues**:
- [Amazon Associates Support](https://affiliate.amazon.in/help)
- [PA API Documentation](https://webservices.amazon.com/paapi5/documentation/)
- [PA API Forums](https://webservices.amazon.com/paapi5/community/)

**For Technical Issues**:
- Check browser console for client-side errors
- Review server logs for API errors
- Verify network connectivity to Amazon services
- Test with a single product before bulk operations

## Additional Resources

- [Amazon PA API Documentation](https://webservices.amazon.com/paapi5/documentation/)
- [Amazon Associates Program](https://affiliate.amazon.in/)
- [PA API Best Practices](https://webservices.amazon.com/paapi5/documentation/best-practices.html)
- [PA API SDK for Node.js](https://github.com/thewisenerd/paapi5-nodejs-sdk)
- [Amazon Associates Operating Agreement](https://affiliate.amazon.in/help/operating/agreement)

## Changelog

### Version 2.0 (Current)
- ✅ Added Products page with category filtering
- ✅ Implemented image URL fetching
- ✅ Added DetailPageURL support for proper affiliate links
- ✅ Enhanced error handling with detailed messages
- ✅ Added search functionality
- ✅ Implemented pagination for product browsing

### Version 1.0
- Initial PA API integration
- Basic product update functionality
- Admin configuration interface
