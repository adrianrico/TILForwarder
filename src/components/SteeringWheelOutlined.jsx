import Icon from '@ant-design/icons'

const SteeringWheelSvg = () => (
  <svg
    viewBox="64 64 896 896"
    focusable="false"
    width="1em"
    height="1em"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="
        M132 512 A380 380 0 1 1 892 512 A380 380 0 1 1 132 512 Z
        M192 512 A320 320 0 1 0 832 512 A320 320 0 1 0 192 512 Z
        M402 512 A110 110 0 1 1 622 512 A110 110 0 1 1 402 512 Z
        M490 392 L534 392 L534 202 L490 202 Z
        M627 553 L792 648 L770 686 L605 591 Z
        M419 591 L255 686 L233 648 L397 553 Z
      "
    />
  </svg>
)

const SteeringWheelOutlined = (props) => <Icon component={SteeringWheelSvg} {...props} />

export default SteeringWheelOutlined
