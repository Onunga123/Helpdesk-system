const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: [true, 'Please describe the maintenance work done'],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    performedByName: { type: String },
    cost: { type: Number, default: 0 },
    nextMaintenanceDate: { type: Date },
  },
  { timestamps: true }
);

const assetSchema = new mongoose.Schema(
  {
    assetTag: { type: String, unique: true },
    name: {
      type: String,
      required: [true, 'Please provide asset name'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: [
        'Desktop Computer',
        'Laptop',
        'Printer',
        'Scanner',
        'Projector',
        'Network Switch',
        'Router',
        'UPS',
        'Monitor',
        'Server',
        'Telephone',
        'Other',
      ],
    },
    brand: { type: String, trim: true, default: '' },
    model: { type: String, trim: true, default: '' },
    serialNumber: { type: String, trim: true, default: '' },
    specifications: { type: String, default: '' },
    condition: {
      type: String,
      enum: ['New', 'Good', 'Fair', 'Poor', 'Faulty', 'Decommissioned'],
      default: 'Good',
    },
    status: {
      type: String,
      enum: ['Available', 'Assigned', 'Under Repair', 'Decommissioned'],
      default: 'Available',
    },
    location: { type: String, trim: true, default: '' },
    department: { type: String, trim: true, default: '' },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedDate: { type: Date, default: null },
    purchaseDate: { type: Date },
    purchasePrice: { type: Number, default: 0 },
    vendor: { type: String, trim: true, default: '' },
    warrantyExpiry: { type: Date },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    maintenanceHistory: [maintenanceSchema],
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

assetSchema.virtual('isUnderWarranty').get(function () {
  if (!this.warrantyExpiry) return false;
  return new Date() < new Date(this.warrantyExpiry);
});

assetSchema.virtual('totalMaintenanceCost').get(function () {
  return this.maintenanceHistory.reduce((total, record) => total + (record.cost || 0), 0);
});

assetSchema.pre('save', async function (next) {
  if (!this.assetTag) {
    const prefixMap = {
      'Desktop Computer': 'PC',
      Laptop: 'LT',
      Printer: 'PR',
      Scanner: 'SC',
      Projector: 'PJ',
      'Network Switch': 'SW',
      Router: 'RT',
      UPS: 'UP',
      Monitor: 'MN',
      Server: 'SV',
      Telephone: 'TL',
      Other: 'OT',
    };
    const prefix = prefixMap[this.category] || 'OT';
    const count = await mongoose.model('Asset').countDocuments();
    const sequence = String(count + 1).padStart(4, '0');
    const random = String(Math.floor(Math.random() * 900) + 100);
    this.assetTag = `TUC-${prefix}-${sequence}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Asset', assetSchema);
