/**
 * Contrôleur carte (GeoJSON)
 */

const { z } = require('zod');
const mapService = require('./service');

const bboxSchema = z.object({
  bounds: z.string().regex(/^-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*$/, 'Format: west,south,east,north').optional(),
  west: z.coerce.number().optional(),
  south: z.coerce.number().optional(),
  east: z.coerce.number().optional(),
  north: z.coerce.number().optional(),
  region: z.string().length(2).optional(),
  limit: z.coerce.number().default(200),
});

const createNodeSchema = z.object({
  profileId: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  province: z.string().length(2).optional(),
  municipality: z.string().optional(),
  category: z.string().optional(),
  url: z.string().url().optional(),
  visibility: z.enum(['public', 'private']).default('public'),
});

async function getNodes(req, res) {
  const validated = bboxSchema.parse(req.query);

  let geojson;

  // Si bounds fournis, parser
  if (validated.bounds) {
    const [west, south, east, north] = validated.bounds.split(',').map(Number);
    geojson = await mapService.getNodesInBbox(west, south, east, north, validated.limit);
  } else if (validated.region) {
    geojson = await mapService.getNodesByRegion(validated.region, validated.limit);
  } else if (validated.west !== undefined && validated.south !== undefined && validated.east !== undefined && validated.north !== undefined) {
    geojson = await mapService.getNodesInBbox(validated.west, validated.south, validated.east, validated.north, validated.limit);
  } else {
    return res.status(400).json({
      error: 'Bbox or region required',
      example: '?bounds=-74,45,-73,46 or ?region=QC',
    });
  }

  res.json(geojson);
}

async function createNode(req, res) {
  const validated = createNodeSchema.parse(req.body);
  const node = await mapService.createNode(validated);
  res.status(201).json(node);
}

async function updateNode(req, res) {
  const { id } = req.params;
  const validated = createNodeSchema.partial().parse(req.body);
  const node = await mapService.updateNode(id, validated);
  res.json(node);
}

async function deleteNode(req, res) {
  const { id } = req.params;
  await mapService.deleteNode(id);
  res.status(204).send();
}

module.exports = {
  getNodes,
  createNode,
  updateNode,
  deleteNode,
};
