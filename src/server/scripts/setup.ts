import { db } from "~/server/db";
import { env } from "~/server/env";
import bcryptjs from "bcryptjs";
import { mdToPdf } from "md-to-pdf";
import * as path from "path";
import * as fs from "fs";
import { minioClient } from "~/server/minio";

async function convertManualToPdf() {
  try {
    const markdownPath = path.join(process.cwd(), "docs", "PC-ASSEMBLY-MANUAL.md");
    const pdfPath = path.join(process.cwd(), "public", "pc-assembly-manual.pdf");

    // Check if markdown file exists
    if (!fs.existsSync(markdownPath)) {
      console.log("⚠ PC Assembly Manual markdown file not found, skipping PDF conversion");
      return;
    }

    console.log("Converting PC Assembly Manual to PDF...");

    // Convert markdown to PDF with custom styling
    const pdf = await mdToPdf(
      { path: markdownPath },
      {
        dest: pdfPath,
        pdf_options: {
          format: "A4",
          margin: {
            top: "20mm",
            right: "20mm",
            bottom: "20mm",
            left: "20mm",
          },
          printBackground: true,
        },
        stylesheet: `
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 100%;
            padding: 0;
          }
          h1 {
            color: #1a202c;
            border-bottom: 3px solid #3182ce;
            padding-bottom: 0.3em;
            margin-top: 1.5em;
            page-break-after: avoid;
          }
          h2 {
            color: #2d3748;
            border-bottom: 2px solid #4299e1;
            padding-bottom: 0.3em;
            margin-top: 1.2em;
            page-break-after: avoid;
          }
          h3 {
            color: #4a5568;
            margin-top: 1em;
            page-break-after: avoid;
          }
          h4, h5 {
            color: #718096;
            page-break-after: avoid;
          }
          code {
            background-color: #f7fafc;
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
          }
          pre {
            background-color: #f7fafc;
            padding: 1em;
            border-radius: 5px;
            border-left: 4px solid #3182ce;
            overflow-x: auto;
            page-break-inside: avoid;
          }
          pre code {
            background-color: transparent;
            padding: 0;
          }
          blockquote {
            border-left: 4px solid #e2e8f0;
            padding-left: 1em;
            color: #718096;
            font-style: italic;
            margin: 1em 0;
          }
          ul, ol {
            margin: 0.5em 0;
            padding-left: 2em;
          }
          li {
            margin: 0.3em 0;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
            page-break-inside: avoid;
          }
          th, td {
            border: 1px solid #e2e8f0;
            padding: 0.5em;
            text-align: left;
          }
          th {
            background-color: #f7fafc;
            font-weight: bold;
          }
          a {
            color: #3182ce;
            text-decoration: none;
          }
          strong {
            color: #2d3748;
            font-weight: 600;
          }
          hr {
            border: none;
            border-top: 2px solid #e2e8f0;
            margin: 2em 0;
          }
          .page-break {
            page-break-after: always;
          }
        `,
      }
    );

    if (pdf) {
      console.log("✓ PC Assembly Manual converted to PDF successfully");
      console.log(`  Output: ${pdfPath}`);
    }
  } catch (error) {
    console.error("✗ Error converting PC Assembly Manual to PDF:", error);
    console.log("  Continuing with setup...");
  }
}

async function setup() {
  console.log("Running setup script...");

  // 1. Create admin user if not exists
  const existingAdmin = await db.admin.findFirst({
    where: { email: "admin@test.com" },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcryptjs.hash(env.ADMIN_PASSWORD, 10);
    await db.admin.create({
      data: {
        email: "admin@test.com",
        hashedPassword,
      },
    });
    console.log("✓ Created admin user (admin@test.com)");
  } else {
    console.log("✓ Admin user already exists");
  }

  // Create second admin user if not exists
  const existingAdmin2 = await db.admin.findFirst({
    where: { email: "joseph4vkb@gmail.com" },
  });

  if (!existingAdmin2) {
    const hashedPassword2 = await bcryptjs.hash("Pranit#86!23", 10);
    await db.admin.create({
      data: {
        email: "joseph4vkb@gmail.com",
        hashedPassword: hashedPassword2,
      },
    });
    console.log("✓ Created admin user (joseph4vkb@gmail.com)");
  } else {
    console.log("✓ Admin user joseph4vkb@gmail.com already exists");
  }

  // 2. Create initial AdminConfig if not exists
  const existingConfig = await db.adminConfig.findFirst();

  if (!existingConfig) {
    await db.adminConfig.create({
      data: {
        openrouterApiKey: env.OPENROUTER_API_KEY,
        openrouterModel: "anthropic/claude-3.5-sonnet",
        amazonAffiliateId: env.AMAZON_ASSOCIATE_TAG || "eknowledgetre-21",
      },
    });
    console.log("✓ Created initial AdminConfig");
  } else {
    console.log("✓ AdminConfig already exists");
  }

  // 3. Seed sample builds if not exists
  const existingBuilds = await db.pcBuild.count();

  if (existingBuilds === 0) {
    const sampleBuilds = [
      {
        category: "Gaming",
        budget: 125000,
        compatibility: 98.5,
        isFeatured: true,
        parts: [
          {
            category: "CPU",
            name: "AMD Ryzen 5 7600",
            asin: "B0BTDL8N8T",
            price: 18500,
            specs: { cores: 6, threads: 12, baseClock: "3.8 GHz" },
          },
          {
            category: "Motherboard",
            name: "Gigabyte B650 Gaming X",
            asin: "B0C8T4XJ9M",
            price: 15200,
            specs: { chipset: "B650", formFactor: "ATX" },
          },
          {
            category: "RAM",
            name: "Corsair Vengeance 16GB DDR5",
            asin: "B0B8QXNM7K",
            price: 6800,
            specs: { capacity: "16GB", speed: "5600MHz", type: "DDR5" },
          },
          {
            category: "GPU",
            name: "Nvidia RTX 4060 Ti",
            asin: "B0C7QKXF9P",
            price: 42000,
            specs: { vram: "8GB", chipset: "RTX 4060 Ti" },
          },
          {
            category: "SSD",
            name: "Samsung 980 Pro 1TB NVMe",
            asin: "B08GLX7TNT",
            price: 8500,
            specs: { capacity: "1TB", interface: "NVMe PCIe 4.0" },
          },
          {
            category: "PSU",
            name: "Corsair RM750e 750W 80+ Gold",
            asin: "B0BQ3M7CWB",
            price: 8500,
            specs: { wattage: "750W", efficiency: "80+ Gold" },
          },
          {
            category: "Case",
            name: "NZXT H510 Flow",
            asin: "B097P4D8N2",
            price: 7500,
            specs: { formFactor: "Mid Tower", color: "Black" },
          },
          {
            category: "Cooler",
            name: "Cooler Master Hyper 212",
            asin: "B07H22TC1N",
            price: 2500,
            specs: { type: "Air Cooler", height: "158mm" },
          },
        ],
      },
      {
        category: "Content Creation",
        budget: 200000,
        compatibility: 99.2,
        isFeatured: true,
        parts: [
          {
            category: "CPU",
            name: "AMD Ryzen 9 7900X",
            asin: "B0BBHD5D8Y",
            price: 38000,
            specs: { cores: 12, threads: 24, baseClock: "4.7 GHz" },
          },
          {
            category: "Motherboard",
            name: "ASUS ROG Strix X670E-E",
            asin: "B0BDTN8SNJ",
            price: 32000,
            specs: { chipset: "X670E", formFactor: "ATX" },
          },
          {
            category: "RAM",
            name: "G.Skill Trident Z5 32GB DDR5",
            asin: "B09NTPS7N7",
            price: 14500,
            specs: { capacity: "32GB", speed: "6000MHz", type: "DDR5" },
          },
          {
            category: "GPU",
            name: "Nvidia RTX 4070 Ti",
            asin: "B0BN9KYKV3",
            price: 68000,
            specs: { vram: "12GB", chipset: "RTX 4070 Ti" },
          },
          {
            category: "SSD",
            name: "Samsung 990 Pro 2TB NVMe",
            asin: "B0BHJJ9Y77",
            price: 17500,
            specs: { capacity: "2TB", interface: "NVMe PCIe 4.0" },
          },
          {
            category: "PSU",
            name: "Corsair HX1000 1000W 80+ Platinum",
            asin: "B0B3ZTXZGR",
            price: 15500,
            specs: { wattage: "1000W", efficiency: "80+ Platinum" },
          },
          {
            category: "Case",
            name: "Lian Li O11 Dynamic EVO",
            asin: "B09TZ8K8VG",
            price: 11000,
            specs: { formFactor: "Mid Tower", color: "White" },
          },
          {
            category: "Cooler",
            name: "NZXT Kraken X63 280mm AIO",
            asin: "B082DYR4PF",
            price: 12000,
            specs: { type: "AIO Liquid", radiatorSize: "280mm" },
          },
        ],
      },
      {
        category: "AI/ML Development",
        budget: 350000,
        compatibility: 97.8,
        isFeatured: true,
        parts: [
          {
            category: "CPU",
            name: "AMD Ryzen 9 7950X",
            asin: "B0BBHHT7VY",
            price: 52000,
            specs: { cores: 16, threads: 32, baseClock: "4.5 GHz" },
          },
          {
            category: "Motherboard",
            name: "ASUS ProArt X670E Creator",
            asin: "B0BDTQ1KQB",
            price: 45000,
            specs: { chipset: "X670E", formFactor: "ATX" },
          },
          {
            category: "RAM",
            name: "Corsair Dominator 64GB DDR5",
            asin: "B09NVGBR4D",
            price: 28000,
            specs: { capacity: "64GB", speed: "5600MHz", type: "DDR5" },
          },
          {
            category: "GPU",
            name: "Nvidia RTX 4090",
            asin: "B0BG9ZX4RD",
            price: 165000,
            specs: { vram: "24GB", chipset: "RTX 4090" },
          },
          {
            category: "SSD",
            name: "Samsung 990 Pro 4TB NVMe",
            asin: "B0BHJJ9Y77",
            price: 32000,
            specs: { capacity: "4TB", interface: "NVMe PCIe 4.0" },
          },
          {
            category: "PSU",
            name: "Corsair HX1500i 1500W 80+ Platinum",
            asin: "B0B3ZTXZGR",
            price: 28000,
            specs: { wattage: "1500W", efficiency: "80+ Platinum" },
          },
          {
            category: "Case",
            name: "Fractal Design Torrent",
            asin: "B09FQVXQTB",
            price: 18000,
            specs: { formFactor: "Full Tower", color: "Black" },
          },
          {
            category: "Cooler",
            name: "Arctic Liquid Freezer II 360",
            asin: "B07WSDLRVP",
            price: 10000,
            specs: { type: "AIO Liquid", radiatorSize: "360mm" },
          },
        ],
      },
      {
        category: "Budget Gaming",
        budget: 60000,
        compatibility: 96.5,
        isFeatured: true,
        parts: [
          {
            category: "CPU",
            name: "AMD Ryzen 5 5600",
            asin: "B09VCHR1VH",
            price: 12500,
            specs: { cores: 6, threads: 12, baseClock: "3.5 GHz" },
          },
          {
            category: "Motherboard",
            name: "MSI B550M PRO-VDH",
            asin: "B089CZSQB4",
            price: 8500,
            specs: { chipset: "B550", formFactor: "Micro ATX" },
          },
          {
            category: "RAM",
            name: "Crucial 16GB DDR4",
            asin: "B08C4Z69LN",
            price: 3500,
            specs: { capacity: "16GB", speed: "3200MHz", type: "DDR4" },
          },
          {
            category: "GPU",
            name: "AMD RX 6600",
            asin: "B09HK9KQXZ",
            price: 22000,
            specs: { vram: "8GB", chipset: "RX 6600" },
          },
          {
            category: "SSD",
            name: "Crucial P3 500GB NVMe",
            asin: "B0B25LQQPC",
            price: 3500,
            specs: { capacity: "500GB", interface: "NVMe PCIe 3.0" },
          },
          {
            category: "PSU",
            name: "Cooler Master MWE 550W 80+ Bronze",
            asin: "B07JGFVZGM",
            price: 4500,
            specs: { wattage: "550W", efficiency: "80+ Bronze" },
          },
          {
            category: "Case",
            name: "Ant Esports ICE-120AG",
            asin: "B07YDKZXRN",
            price: 2500,
            specs: { formFactor: "Mid Tower", color: "Black" },
          },
          {
            category: "Cooler",
            name: "Deepcool GAMMAXX 400",
            asin: "B00YPQW6EA",
            price: 1500,
            specs: { type: "Air Cooler", height: "155mm" },
          },
        ],
      },
      {
        category: "Office/Productivity",
        budget: 45000,
        compatibility: 99.0,
        isFeatured: false,
        parts: [
          {
            category: "CPU",
            name: "Intel Core i5-12400",
            asin: "B09MDHF8XN",
            price: 14500,
            specs: { cores: 6, threads: 12, baseClock: "2.5 GHz" },
          },
          {
            category: "Motherboard",
            name: "Gigabyte B660M DS3H",
            asin: "B09PKQQ6RL",
            price: 9500,
            specs: { chipset: "B660", formFactor: "Micro ATX" },
          },
          {
            category: "RAM",
            name: "Kingston Fury 16GB DDR4",
            asin: "B097K2GY8C",
            price: 3800,
            specs: { capacity: "16GB", speed: "3200MHz", type: "DDR4" },
          },
          {
            category: "GPU",
            name: "Intel UHD Graphics 730",
            asin: "INTEGRATED",
            price: 0,
            specs: { vram: "Integrated", chipset: "UHD 730" },
          },
          {
            category: "SSD",
            name: "WD Blue SN570 500GB NVMe",
            asin: "B09HKG6SDF",
            price: 3500,
            specs: { capacity: "500GB", interface: "NVMe PCIe 3.0" },
          },
          {
            category: "PSU",
            name: "Corsair CV450 450W 80+ Bronze",
            asin: "B07YVVXYFN",
            price: 3500,
            specs: { wattage: "450W", efficiency: "80+ Bronze" },
          },
          {
            category: "Case",
            name: "Cooler Master MasterBox Q300L",
            asin: "B0785GRMPG",
            price: 3200,
            specs: { formFactor: "Micro ATX", color: "Black" },
          },
          {
            category: "Cooler",
            name: "Intel Stock Cooler",
            asin: "STOCK",
            price: 0,
            specs: { type: "Stock Cooler", height: "60mm" },
          },
        ],
      },
    ];

    // Calculate totalCost for each build from parts
    const buildsWithCalculatedCosts = sampleBuilds.map(build => ({
      ...build,
      totalCost: build.parts.reduce((sum, part) => sum + part.price, 0),
    }));

    for (const build of buildsWithCalculatedCosts) {
      await db.pcBuild.create({ data: build });
    }
    console.log(`✓ Seeded ${buildsWithCalculatedCosts.length} sample PC builds`);
  } else {
    console.log(`✓ Database already has ${existingBuilds} builds`);
  }

  // 4. Convert PC Assembly Manual to PDF
  await convertManualToPdf();

  // 5. Setup MinIO bucket for blog images
  try {
    const bucketName = "blog-images";
    const bucketExists = await minioClient.bucketExists(bucketName);
    
    if (!bucketExists) {
      await minioClient.makeBucket(bucketName, "us-east-1");
      console.log(`✓ Created MinIO bucket: ${bucketName}`);
      
      // Set bucket policy to allow public read access
      const policy = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${bucketName}/*`],
          },
        ],
      };
      
      await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
      console.log(`✓ Set public read policy for bucket: ${bucketName}`);
    } else {
      console.log(`✓ MinIO bucket ${bucketName} already exists`);
    }
  } catch (error) {
    console.error("✗ Error setting up MinIO bucket for blog images:", error);
    console.log("  Continuing with setup...");
  }

  console.log("Setup complete!");
}

setup()
  .then(() => {
    console.log("setup.ts complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
