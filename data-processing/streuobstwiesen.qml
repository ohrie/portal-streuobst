<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE qgis PUBLIC 'http://mrcc.com/qgis.dtd' 'SYSTEM'>
<qgis version="3.34.0-Prize" styleCategories="AllStyleCategories">
  <flags>
    <Identifiable>1</Identifiable>
    <Removable>1</Removable>
    <Searchable>1</Searchable>
    <Private>0</Private>
  </flags>
  <renderer-v2 type="RuleRenderer" symbollevels="0" enableorderby="0" forceraster="0">
    <rules key="{a1b2c3d4-0001-0000-0000-000000000001}">
      <rule key="{a1b2c3d4-0001-0000-0000-000000000002}" filter="&quot;orchard&quot; = 'meadow_orchard'" symbol="0" label="Streuobstwiesen (orchard=meadow_orchard)"/>
      <rule key="{a1b2c3d4-0001-0000-0000-000000000003}" filter="&quot;orchard&quot; = 'plantation'" symbol="1" label="Obstplantagen (orchard=plantation)"/>
      <rule key="{a1b2c3d4-0001-0000-0000-000000000004}" filter="ELSE" symbol="2" label="Obstwiesen (allgemein)"/>
    </rules>
    <symbols>
      <symbol type="fill" name="0" alpha="0.5" outputUnit="MM" clip_to_extent="1" force_rhr="0">
        <layer class="SimpleFill" enabled="1" locked="0" pass="0">
          <prop k="color" v="255,140,0,255"/>
          <prop k="style" v="solid"/>
          <prop k="outline_color" v="200,110,0,255"/>
          <prop k="outline_style" v="solid"/>
          <prop k="outline_width" v="0.26"/>
          <prop k="outline_width_unit" v="MM"/>
          <prop k="joinstyle" v="miter"/>
          <prop k="offset" v="0,0"/>
          <prop k="offset_unit" v="MM"/>
        </layer>
      </symbol>
      <symbol type="fill" name="1" alpha="0.5" outputUnit="MM" clip_to_extent="1" force_rhr="0">
        <layer class="SimpleFill" enabled="1" locked="0" pass="0">
          <prop k="color" v="156,163,175,255"/>
          <prop k="style" v="solid"/>
          <prop k="outline_color" v="120,128,138,255"/>
          <prop k="outline_style" v="solid"/>
          <prop k="outline_width" v="0.26"/>
          <prop k="outline_width_unit" v="MM"/>
          <prop k="joinstyle" v="miter"/>
          <prop k="offset" v="0,0"/>
          <prop k="offset_unit" v="MM"/>
        </layer>
      </symbol>
      <symbol type="fill" name="2" alpha="0.5" outputUnit="MM" clip_to_extent="1" force_rhr="0">
        <layer class="SimpleFill" enabled="1" locked="0" pass="0">
          <prop k="color" v="102,115,2,255"/>
          <prop k="style" v="solid"/>
          <prop k="outline_color" v="76,86,1,255"/>
          <prop k="outline_style" v="solid"/>
          <prop k="outline_width" v="0.26"/>
          <prop k="outline_width_unit" v="MM"/>
          <prop k="joinstyle" v="miter"/>
          <prop k="offset" v="0,0"/>
          <prop k="offset_unit" v="MM"/>
        </layer>
      </symbol>
    </symbols>
  </renderer-v2>
  <labeling type="simple">
    <settings calloutType="simple">
      <text-style fieldName="name" isExpression="0" fontSize="9" fontFamily="Sans Serif" fontWeight="50" fontItalic="0" fontUnderline="0" fontStrikeout="0" textOpacity="1" blendMode="0" fontSizeUnit="Point" textColor="0,0,0,255"/>
      <text-buffer bufferDraw="1" bufferSize="1" bufferColor="255,255,255,200" bufferNoFill="0" bufferSizeUnits="MM" bufferOpacity="1"/>
      <placement placement="1" centroidInside="1" fitInPolygonOnly="0" dist="0" priority="5" layerType="PolygonGeometry"/>
      <rendering drawLabels="1" scaleVisibility="1" scaleMin="50000" scaleMax="1000" minFeatureSize="8"/>
    </settings>
  </labeling>
  <customproperties>
    <Option/>
  </customproperties>
  <blendMode>0</blendMode>
  <featureBlendMode>0</featureBlendMode>
  <layerOpacity>1</layerOpacity>
  <previewExpression>COALESCE("name", "osm_id")</previewExpression>
  <layerGeometryType>2</layerGeometryType>
</qgis>
