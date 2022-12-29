import { observer } from 'mobx-react';
import * as React from 'react';
import { TypeName } from '../../common-elements/fields';

import {
  ProtobufOneofInnerPropertiesWrap,
  PropertiesTable,
  PropertyBullet,
  PropertyCellWithInner,
  ProtobufOneofCell,
} from '../../common-elements/fields-layout';

import type { FieldModel } from '../../services/models';
import { mapWithLast } from '../../utils';
import { Field } from './Field';

export interface ProtobufOneofProps {
  items: FieldModel[];
  level?: number;
  isLast?: boolean;
  skipReadOnly?: boolean;
  skipWriteOnly?: boolean;
  showTitle?: boolean;
}

@observer
export class ProtobufOneof extends React.Component<ProtobufOneofProps> {
  render() {
    const { items, isLast, level, skipReadOnly, skipWriteOnly, showTitle } = this.props;
    if (items.length == 1) {
      // If oneof contains a single field, just inline it
      const field = items[0];
      return (
        <Field
          key={field.name}
          isLast={isLast}
          field={field}
          className={field.expanded ? 'expanded' : undefined}
          skipReadOnly={skipReadOnly}
          skipWriteOnly={skipWriteOnly}
          showTitle={showTitle}
          level={level}
        />
      );
    }
    return (
      <>
        <tr className={isLast ? 'last' : ''}>
          <ProtobufOneofCell colSpan={2}>
            <PropertyBullet />
            <span>
              <TypeName>One of:</TypeName>
            </span>
          </ProtobufOneofCell>
        </tr>
        <tr>
          <PropertyCellWithInner colSpan={2}>
            <ProtobufOneofInnerPropertiesWrap style={{ marginTop: 0, paddingTop: 0 }}>
              <PropertiesTable>
                <tbody>
                  {mapWithLast(items, (field, isLast) => {
                    return (
                      <Field
                        key={field.name}
                        isLast={isLast}
                        field={field}
                        className={field.expanded ? 'expanded' : undefined}
                        skipReadOnly={skipReadOnly}
                        skipWriteOnly={skipWriteOnly}
                        showTitle={showTitle}
                        level={level}
                      />
                    );
                  })}
                </tbody>
              </PropertiesTable>
            </ProtobufOneofInnerPropertiesWrap>
          </PropertyCellWithInner>
        </tr>
      </>
    );
  }
}
