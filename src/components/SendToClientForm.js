import { uploadToS3 } from "../services/s3"
import { newRecordInDb } from "../services/documents"
import { sendViaDocusign } from "../services/docusign"
import { useState } from 'react'
import { Button, Upload, Space, Form, Input } from 'antd'
import { useLoaderData } from "react-router-dom"
import { UploadOutlined } from '@ant-design/icons'
import CustomCheckCircleIcon from './CustomCheckCircleIcon'
import { props, initializeFormData, initialFormValue } from "./sendToClientForm_helper"

const SendToClientForm = ({ backendRouteCategory, setNewDocument}) => {

    const [form, setForm] = useState(initialFormValue)

    const project = useLoaderData()
    const uploadProps = props(form, setForm)

    const handleFormChange = (e) => {
        e.preventDefault();
        setForm({
            ...form,
            [e.target.name]: e.target.value
        })
    }
     
    // This is a very long submit handler which carries out an effects chain. 
    const handleSubmit = async (e) => {
        e.preventDefault()

        const answer = window.confirm("Confirm submitting this to client?")
        
        if (!answer) {
            console.log("Do nothing. ")
            return
        }

        const formData = initializeFormData(form.file.name, project.id, form.file)
        
        try {
            // Uploads to S3
            const res = await uploadToS3(formData)

            if (!res.data.success) {
                alert("Error in uploading to S3")
                return
            }

            const tempRecord = {
                file: {
                    url: res.data.file,
                    contentType: res.data.contentType
                },
                fileName: res.data.name,
                isSent: false,
                isSigned: false,
                isNew: true
            }

            // Set page state upon success
            setNewDocument(tempRecord)
            setForm(initialFormValue)

            // Trigger docusign email
            const docusignRes = await sendViaDocusign({
                ...res.data,
                signerEmail: form.emailAddress,
                signerName: form.clientName,
                ccEmail: 'leibingguo@gmail.com',
                ccName: 'Leibing'
            })

            if (docusignRes.status !== 200) {
                alert("Error in sending via Docusign")
                return
            }

            // If successful, uploads to Db and sets page state 
            if (docusignRes.data.status === 'sent') {
                const recordData = {
                    fileName: res.data.name,
                    file: {
                        url: res.data.file,
                        contentType: res.data.contentType,
                    },
                    isSent: true,
                    dateSent: docusignRes.data.sentTime,
                    envelopeId: docusignRes.data.envelopeId,
                    isSigned: false
                }
                const newDbRecordRes = await newRecordInDb(backendRouteCategory, recordData)
                setNewDocument(newDbRecordRes.data)
            }
        } catch (err) {
            console.log(err)
        }
    }

    
    return (
        <>
            <Space>
                <CustomCheckCircleIcon />
                <h2>Upload And Send {backendRouteCategory} For Signing</h2>
            </Space>

            <div style={{ border: '1px solid #ccc', padding: '16px' }}>
                <h3>Send new document:</h3>
                <p>Attach new file and details below</p>
                <Upload {...uploadProps}>
                    <Button icon={<UploadOutlined />}>Click to Upload</Button>
                </Upload>

                <hr 
                    style={{ 
                        border: 'none', 
                        borderTop: '2px solid #ccc', 
                        margin: '16px 0'
                     }} 
                /> 

                <Form 
                    onSubmit={handleSubmit}
                    layout='vertical'
                >
                    <Form.Item label="Enter client's name & email address" name="Client">
                        <Input
                            name="clientName"
                            placeholder="Client's Name"
                            // prefix={<UserOutlined />}
                            value={form.clientName}
                            onChange={handleFormChange}
                            style={{ 
                                display: 'inline-block',
                                width: 'calc(50% - 8px)',
                                marginRight: '8px',
                            }}
                        />

                        <Input
                            name="emailAddress"
                            placeholder='Email Address'
                            value={form.emailAddress}
                            onChange={handleFormChange}
                            style={{ 
                                display: 'inline-block',
                                width: 'calc(50% - 8px)',
                                marginLeft: '8px'
                            }}
                        />
                    </Form.Item>


                    <Form.Item style={{ textAlign: 'right' }}>
                        <Button type="primary" htmlType="submit" onClick={handleSubmit}>
                            Send document via Docusign
                        </Button>
                    </Form.Item>
                </Form>

            </div>
        </>
    )
}

export default SendToClientForm