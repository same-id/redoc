import { observer } from 'mobx-react';
import * as React from 'react';

import { FieldModel, SchemaModel } from '../../services/models';

import { PropertiesTable, PropertiesTableCaption } from '../../common-elements/fields-layout';
import { Field } from '../Fields/Field';
import { DiscriminatorDropdown } from './DiscriminatorDropdown';
import { SchemaProps } from './Schema';

import { mapWithLast } from '../../utils';
import { OptionsContext } from '../OptionsProvider';
import { ProtobufOneof } from '../Fields/ProtobufOneof';

export interface ObjectSchemaProps extends SchemaProps {
  discriminator?: {
    fieldName: string;
    parentSchema: SchemaModel;
  };
}

const snakeToCamel = str =>
  str
    .toLowerCase()
    .replace(/([-_][a-z])/g, group => group.toUpperCase().replace('-', '').replace('_', ''));

class ProtobufOneofModel {
  items: FieldModel[];
}

export const ObjectSchema = observer(
  ({
    schema: { fields = [], title, protobufOneofSelector: protobufOneofSelectorSchema },
    showTitle,
    discriminator,
    skipReadOnly,
    skipWriteOnly,
    level,
    protobufOneofSelector,
  }: ObjectSchemaProps) => {
    const { expandSingleSchemaField, showObjectSchemaExamples, schemaExpansionLevel } =
      React.useContext(OptionsContext);

    if (!protobufOneofSelector && protobufOneofSelectorSchema) {
      protobufOneofSelector = protobufOneofSelectorSchema;
    }
    let currentProtobufOneofSelector;
    let restProtobufOneofSelector;
    if (protobufOneofSelector) {
      const dot = protobufOneofSelector.indexOf('.');
      if (dot != -1) {
        currentProtobufOneofSelector = protobufOneofSelector.slice(0, dot);
        restProtobufOneofSelector = protobufOneofSelector.slice(dot + 1);
      } else {
        currentProtobufOneofSelector = protobufOneofSelector;
      }
    }

    const filteredFields = React.useMemo(() => {
      const filteredSkipped =
        skipReadOnly || skipWriteOnly
          ? fields.filter(
              item =>
                !(
                  (skipReadOnly && item.schema.readOnly) ||
                  (skipWriteOnly && item.schema.writeOnly)
                ),
            )
          : fields;
      const filteredProtobufOneof: (FieldModel | ProtobufOneofModel)[] = [];
      outer: for (const item of filteredSkipped) {
        if (!item.schema.protobufOneof) {
          filteredProtobufOneof.push(item);
          continue;
        }
        for (const protobufOneof of filteredProtobufOneof) {
          if (!(protobufOneof instanceof ProtobufOneofModel)) {
            continue;
          }
          if (protobufOneof.items[0].schema.protobufOneof === item.schema.protobufOneof) {
            if (currentProtobufOneofSelector) {
              if (
                snakeToCamel(protobufOneof.items[0].name) ==
                snakeToCamel(currentProtobufOneofSelector)
              ) {
                // Skip field
                continue outer;
              }
              if (snakeToCamel(item.name) == snakeToCamel(currentProtobufOneofSelector)) {
                // Skip existing fields
                protobufOneof.items = [item];
                continue outer;
              }
            }
            protobufOneof.items.push(item);
            continue outer;
          }
        }
        const newOneof = new ProtobufOneofModel();
        newOneof.items = [item];
        filteredProtobufOneof.push(newOneof);
      }
      return filteredProtobufOneof;
    }, [skipReadOnly, skipWriteOnly, fields, currentProtobufOneofSelector]);

    const expandByDefault =
      (expandSingleSchemaField && filteredFields.length === 1) || schemaExpansionLevel >= level!;

    return (
      <PropertiesTable>
        {showTitle && <PropertiesTableCaption>{title}</PropertiesTableCaption>}
        <tbody>
          {mapWithLast(filteredFields, (field, isLast) => {
            if (field instanceof ProtobufOneofModel) {
              // TODO:
              // Pass more options to ProtobufOneof so it can pass them later to
              // each field, like we can see below.
              // However, some options might not be relevant:
              // * renderDiscriminatorSwitch - we don't expect OAS discrimintators in
              //   transcoded gRPC APIs
              // * expandByDefault - the oneof should always be exapnded by default since the
              //   fields are actually in the same nesting in the schema
              // * showExamples?
              return (
                <ProtobufOneof
                  items={field.items}
                  no_siblings={filteredFields.length === 1}
                  isLast={isLast}
                  level={level}
                  skipReadOnly={skipReadOnly}
                  skipWriteOnly={skipWriteOnly}
                  showTitle={showTitle}
                />
              );
            }
            return (
              <Field
                key={field.name}
                isLast={isLast}
                field={field}
                expandByDefault={expandByDefault}
                renderDiscriminatorSwitch={
                  discriminator?.fieldName === field.name
                    ? () => (
                        <DiscriminatorDropdown
                          parent={discriminator!.parentSchema}
                          enumValues={field.schema.enum}
                        />
                      )
                    : undefined
                }
                className={field.expanded ? 'expanded' : undefined}
                showExamples={showObjectSchemaExamples}
                skipReadOnly={skipReadOnly}
                skipWriteOnly={skipWriteOnly}
                showTitle={showTitle}
                level={level}
                protobufOneofSelector={
                  snakeToCamel(field.name) === snakeToCamel(currentProtobufOneofSelector || '')
                    ? restProtobufOneofSelector
                    : undefined
                }
              />
            );
          })}
        </tbody>
      </PropertiesTable>
    );
  },
);
