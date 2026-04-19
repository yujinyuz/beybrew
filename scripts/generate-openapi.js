#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const data = JSON.parse(readFileSync(resolve(root, 'public/api/data.json'), 'utf8'))

const i18nObject = {
  type: 'object',
  properties: {
    'ja-JP': { type: 'string' },
    'en-US': { type: 'string' },
    'en-SG': { type: 'string' },
    'ko-KR': { type: 'string' },
    'zh-TW': { type: 'string' },
    'zh-HK': { type: 'string' },
  },
}

const statusObject = {
  type: 'object',
  properties: {
    attack:  { type: 'integer' },
    defense: { type: 'integer' },
    stamina: { type: 'integer' },
    height:  { type: 'integer' },
    dash:    { type: 'integer' },
    burst:   { type: 'integer' },
    weight:  { type: 'integer' },
  },
}

const partSchema = {
  type: 'object',
  properties: {
    id:                   { type: 'string', example: 'BLD-PRD-012345-00' },
    en_name:              { type: 'string', example: 'Dran Sword' },
    group_id:             { type: 'string', example: 'DranSword' },
    model_name:           { type: 'string' },
    series_name:          { type: 'string' },
    type:                 { type: 'string', enum: ['attack', 'defense', 'stamina', 'balance'], nullable: true },
    parts_customize_type: { type: 'string', enum: ['none', 'CX', 'RandB'] },
    tags:                 { type: 'array', items: { type: 'string' } },
    image:                { type: 'string', example: 'DranSword.png', description: 'Filename under /images/' },
    deck_configurable:    { type: 'boolean' },
    collection_order:     { type: 'integer' },
    release_at:           { type: 'string', format: 'date-time' },
    update_at:            { type: 'string', format: 'date-time' },
    color:                { type: 'string' },
    color_option:         { type: 'string' },
    blade_num:            { type: 'integer' },
    setpoint:             { type: 'integer' },
    show_mode_change_icon:{ type: 'boolean' },
    show_expand_icon:     { type: 'boolean' },
    simple_ratchet_only:  { type: 'boolean' },
    fixed_burst:          { type: 'boolean' },
    name:                 i18nObject,
    catalog_title:        i18nObject,
    description:          i18nObject,
    style_name:           i18nObject,
    defaultStatus:        {
      allOf: [statusObject],
      description: 'Base stats including optional rotation field',
      properties: { rotation: { type: 'string', enum: ['right', 'left'] } },
    },
    updateStatus: statusObject,
  },
}

const collectionNames = Object.keys(data)

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'BeyBrew Parts API',
    version: 'v2025.11',
    description:
      'Static Beyblade X parts database served by BeyBrew. ' +
      'Single endpoint returning all part collections as named arrays.',
    contact: { url: 'https://github.com/yujinyuz/bbx-mixer' },
  },
  servers: [{ url: '/' }],
  paths: {
    '/api/data.json': {
      get: {
        summary: 'Get all Beyblade X parts',
        operationId: 'getAllParts',
        tags: ['Parts'],
        description:
          'Returns a JSON object with 8 arrays of Beyblade X parts: blades, assist_blades, ' +
          'main_blades, metal_blades, over_blades, ratchets, bits, and lock_chips.',
        responses: {
          '200': {
            description: 'All parts collections',
            headers: {
              'Cache-Control': {
                schema: { type: 'string' },
                description: 'public, max-age=3600',
              },
            },
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: Object.fromEntries(
                    collectionNames.map(name => [
                      name,
                      {
                        type: 'array',
                        description: `${data[name].length} items`,
                        items: { $ref: '#/components/schemas/Part' },
                      },
                    ])
                  ),
                },
                example: Object.fromEntries(
                  collectionNames.map(name => [name, data[name].slice(0, 1)])
                ),
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Part: partSchema,
    },
  },
  tags: [{ name: 'Parts', description: 'Beyblade X part collections' }],
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BeyBrew Parts API Docs</title>
  <script type="module" src="https://unpkg.com/rapidoc/dist/rapidoc-min.js"><\/script>
</head>
<body>
  <rapi-doc
    spec-url=""
    theme="dark"
    render-style="read"
    show-header="true"
    allow-authentication="false"
    allow-server-selection="false"
    show-info="true"
    primary-color="#e85d04"
    bg-color="#0d0d0d"
    text-color="#e0e0e0"
    nav-bg-color="#1a1a1a"
    nav-text-color="#cccccc"
    nav-accent-color="#e85d04"
    font-size="large"
  ></rapi-doc>
  <script>
    const spec = ${JSON.stringify(spec, null, 2)};
    const el = document.querySelector('rapi-doc');
    el.loadSpec(spec);
  <\/script>
</body>
</html>`

writeFileSync(resolve(root, 'public/api/docs.html'), html, 'utf8')
console.log(`✓ public/api/docs.html written (${(html.length / 1024).toFixed(1)} KB)`)
